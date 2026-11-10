// Raccourcis proposés à la création d'une prestation (repris du prototype espace pro).
type ServicePreset = {
  name: string;
  duration: number;
  description: string;
  addon?: { name: string; duration: number };
};

export const SERVICE_PRESETS: readonly ServicePreset[] = [
  {
    name: "Pose wispy",
    duration: 150,
    description:
      "Un effet texturé et plumeux, avec des cils de longueurs alternées pour un regard ouvert et naturel.",
  },
  {
    name: "Pose hybride",
    duration: 135,
    description: "Un mélange de pose classique et de volume pour un effet naturel, mais plus fourni.",
  },
  {
    name: "Volume léger",
    duration: 135,
    description:
      "Deux à trois extensions fines par cil naturel pour un regard plus dense, tout en restant naturel.",
  },
  {
    name: "Méga volume",
    duration: 180,
    description:
      "Un éventail de nombreuses extensions ultra fines sur chaque cil pour un effet très dense et intense.",
  },
  {
    name: "Rehaussement de cils",
    duration: 60,
    description:
      "Courbure et relèvement de tes cils naturels, sans extensions. L’effet dure plusieurs semaines.",
    addon: { name: "Teinture de cils", duration: 15 },
  },
];
