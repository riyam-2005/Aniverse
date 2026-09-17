export interface CharacterSection {
  id: string;
  label: string;
  message: string;
  mood?: "welcome" | "curious" | "excited" | "sparkle" | "hype" | "chill";
}

export interface MascotConfig {
  name: string;
  assetPath: string;
  alt: string;
  sections: CharacterSection[];
  spring: {
    stiffness: number;
    damping: number;
    mass: number;
    restDelta: number;
  };
  floating: {
    yDistance: number;
    duration: number;
    rotationDegrees: number;
  };
}

export const DEFAULT_MASCOT_CONFIG: MascotConfig = {
  name: "Ani",
  assetPath: "/images/aniverse-mascot.png",
  alt: "Ani — AniVerse Mascot Companion",
  spring: {
    stiffness: 75,
    damping: 22,
    mass: 0.8,
    restDelta: 0.001,
  },
  floating: {
    yDistance: 6,
    duration: 3.8,
    rotationDegrees: 1.5,
  },
  sections: [
    {
      id: "hero",
      label: "Hero",
      message: "Welcome to AniVerse! Ready to find your next obsession? ✨",
      mood: "welcome",
    },
    {
      id: "continue-watching",
      label: "Continue Watching",
      message: "Picking up right where you left off? 🍿",
      mood: "curious",
    },
    {
      id: "seasonal",
      label: "This Season",
      message: "Fresh weekly broadcasts airing right now! 📺",
      mood: "excited",
    },
    {
      id: "recommendations",
      label: "Recommendations",
      message: "I picked these based on your unique Anime DNA 🧬",
      mood: "sparkle",
    },
    {
      id: "trending",
      label: "Trending",
      message: "These are topping the community charts this week! 🔥",
      mood: "hype",
    },
    {
      id: "top-ranked",
      label: "Top Ranked",
      message: "Legendary all-time masterpieces rated by fans ⭐",
      mood: "chill",
    },
    {
      id: "community",
      label: "Community",
      message: "Join the discussions and see what everyone thinks 💬",
      mood: "excited",
    },
    {
      id: "share",
      label: "Share",
      message: "Thanks for exploring AniVerse! Share with a friend ✨",
      mood: "sparkle",
    },
  ],
};
