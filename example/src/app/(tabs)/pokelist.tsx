import {
  AndroidGlassButton,
  useMinimizeOnScrollHandler,
} from "expo-android-glass-view";
import { Image } from "expo-image";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassHeader, HEADER_SPACE } from "@/components/GlassHeader";

const FIRST_PAGE = "https://pokeapi.co/api/v2/pokemon?limit=24&offset=0";
const SPRITES =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const CARD_COLORS = ["#E4F3EB", "#FFF0DF", "#E6EFFF", "#F2E9F8"];

type Pokemon = { id: number; name: string };
type PokemonPage = {
  count: number;
  next: string | null;
  results: { name: string; url: string }[];
};
type LoadMode = "initial" | "more" | "refresh";
type LoadError = { url: string; mode: LoadMode };

// Keep visited pages in memory so returning to the screen avoids repeat requests.
const pageCache = new Map<string, PokemonPage>();

const PokemonCard = memo(function PokemonCard({
  pokemon,
}: {
  pokemon: Pokemon;
}) {
  const [imageAttempt, setImageAttempt] = useState(0);
  const name = pokemon.name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <View
      accessible
      accessibilityLabel={`${name}, number ${pokemon.id}`}
      style={[
        styles.card,
        { backgroundColor: CARD_COLORS[(pokemon.id - 1) % CARD_COLORS.length] },
      ]}
    >
      <Text style={styles.number}>#{String(pokemon.id).padStart(3, "0")}</Text>
      <View style={styles.artwork}>
        {imageAttempt < 2 ? (
          <Image
            source={{
              uri:
                imageAttempt === 0
                  ? `${SPRITES}/other/official-artwork/${pokemon.id}.png`
                  : `${SPRITES}/${pokemon.id}.png`,
            }}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            recyclingKey={`${pokemon.id}-${imageAttempt}`}
            transition={150}
            onError={() =>
              setImageAttempt((current) => Math.min(current + 1, 2))
            }
          />
        ) : (
          <Text style={styles.imageFallback}>?</Text>
        )}
      </View>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
});

function RetryMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.message}>
      <Text style={styles.messageTitle}>Couldn't load Pokémon</Text>
      <Text style={styles.messageText}>
        Check your connection and try again.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function Pokelist() {
  const insets = useSafeAreaInsets();
  const onScroll = useMinimizeOnScrollHandler();
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadMode | null>("initial");
  const [error, setError] = useState<LoadError | null>(null);
  const request = useRef<AbortController | null>(null);

  const loadPage = useCallback(async (url: string, mode: LoadMode) => {
    // A refresh can replace an in-flight page request; duplicate scroll events cannot.
    if (request.current) {
      if (mode !== "refresh") return;
      request.current.abort();
    }

    const controller = new AbortController();
    request.current = controller;
    setLoading(mode);
    setError(null);
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      let page = mode === "refresh" ? undefined : pageCache.get(url);
      if (!page) {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok)
          throw new Error(`PokéAPI returned ${response.status}`);
        page = (await response.json()) as PokemonPage;
      }

      if (request.current !== controller) return;
      if (controller.signal.aborted) throw new Error("Request timed out");

      const entries = page.results.map((item) => {
        const id = Number(item.url.split("/").filter(Boolean).pop());
        if (!Number.isInteger(id) || id < 1)
          throw new Error("Invalid Pokémon ID");
        return { id, name: item.name };
      });

      pageCache.set(url, page);
      setPokemon((current) => {
        if (mode !== "more") return entries;
        const existingIds = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...entries.filter((item) => !existingIds.has(item.id)),
        ];
      });
      setTotal(page.count);
      setNextPage(page.next);
    } catch {
      if (request.current === controller) setError({ url, mode });
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setLoading(null);
      }
    }
  }, []);

  useEffect(() => {
    void loadPage(FIRST_PAGE, "initial");
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [loadPage]);

  const retry = () => {
    if (error) void loadPage(error.url, error.mode);
  };

  return (
    <View style={styles.root}>
      <AndroidGlassButton
        title="View"
        style={{
          position: "absolute",
          left: 50,
          bottom: 500,
          zIndex: 1,
        }}
      />

      <FlatList
        data={pokemon}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <PokemonCard pokemon={item} />}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + HEADER_SPACE,
            paddingBottom: insets.bottom + 96,
            paddingLeft: insets.left + 16,
            paddingRight: insets.right + 16,
          },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshing={loading === "refresh"}
        onRefresh={() => void loadPage(FIRST_PAGE, "refresh")}
        progressViewOffset={insets.top + HEADER_SPACE}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (nextPage && !loading && !error) void loadPage(nextPage, "more");
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.message}>
              <ActivityIndicator size="large" color="#303E35" />
              <Text style={styles.messageText}>Loading Pokémon…</Text>
            </View>
          ) : error ? (
            <RetryMessage onRetry={retry} />
          ) : (
            <View style={styles.message}>
              <Text style={styles.messageTitle}>No Pokémon found</Text>
              <Text style={styles.messageText}>
                Pull down to refresh the list.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          pokemon.length > 0 ? (
            <View style={styles.footer}>
              {loading === "more" ? (
                <ActivityIndicator
                  color="#303E35"
                  accessibilityLabel="Loading more Pokémon"
                />
              ) : error ? (
                <RetryMessage onRetry={retry} />
              ) : (
                <Text style={styles.credit}>
                  {nextPage
                    ? "Keep scrolling to discover more"
                    : "You've seen every Pokémon"}
                  {"\n"}Data & artwork from PokéAPI
                </Text>
              )}
            </View>
          ) : null
        }
      />
      <GlassHeader
        title="Pokédex"
        subtitle={
          total > 0
            ? `${pokemon.length} of ${total} Pokémon`
            : "Discover the world of Pokémon"
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  list: {
    flexGrow: 1,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    maxWidth: "50%",
    borderRadius: 24,
    padding: 16,
  },
  number: {
    fontSize: 12,
    fontWeight: "700",
    color: "#56615D",
    fontVariant: ["tabular-nums"],
  },
  artwork: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    fontSize: 56,
    fontWeight: "800",
    color: "#68746C",
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#18231D",
  },
  message: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 40,
    gap: 12,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#18231D",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#626B66",
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#263C30",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  credit: {
    fontSize: 12,
    lineHeight: 20,
    color: "#626B66",
    textAlign: "center",
  },
});
