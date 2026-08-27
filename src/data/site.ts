export const site = {
  name: "Pranjal Sinha",
  role: "Senior Software Engineer",
  location: "San Francisco, CA",
  description:
    "Senior Software Engineer working on simulation, data infrastructure, and developer tooling for autonomous vehicle development.",

  /* The hero deliberately splits the claim from the stack. A single block
     containing both reads like a resume summary. */
  hero: {
    statement:
      "Working on simulation, data infrastructure, and developer tooling for autonomous vehicle development.",
    subline:
      "Systems spanning data pipelines, Kubernetes, AWS, simulation workflows, and analytics.",
    status: "Senior Software Engineer at Applied Intuition",
  },

  /* Phone number and ZIP stay on the resume PDF. A phone number in indexed
     HTML gets harvested for spam within weeks. */
  email: "pranjalsinha1000@gmail.com",
  links: {
    github: "https://github.com/sinpran",
    linkedin: "https://www.linkedin.com/in/pranjal-sinha/",
    resume: "/resume.pdf",
  },

  about: [
    "I work on the infrastructure behind autonomous vehicle development: the pipelines that turn raw sensor logs into maps, the systems that schedule and run simulations at scale, and the tooling engineers reach for when they want to get work done without fighting the platform.",
    "Most of what I build is invisible when it works. A mapping platform that batch-processes a thousand jobs a week. A spatial index that turns an hours-long query into a minutes-long one. A cost pipeline that makes a six-figure line item legible enough to act on.",
    "Outside work I build small iOS apps, mostly to find out how far a local-first app with no backend can actually go.",
  ],

  /* One line each. The full bullet-by-bullet version lives in the resume PDF;
     repeating it here is what made the page read like a document. */
  experience: [
    {
      company: "Applied Intuition",
      title: "Senior Software Engineer",
      period: "2025 — Present",
      summary:
        "Leading the company-wide mapping architecture, and a LiDAR SLAM platform that batch-processes over a thousand map-generation jobs a week.",
    },
    {
      company: "Applied Intuition",
      title: "Software Engineer II",
      period: "2023 — 2025",
      summary:
        "Built simulation and cost-analytics pipelines across four teams, including a spatial index that took processing from hours to minutes.",
    },
    {
      company: "Shelton AI",
      title: "Software Engineer",
      period: "2022 — 2023",
      summary:
        "Led five engineers on spaCy-based NLP tooling and the data pipeline behind it.",
    },
    {
      company: "Ford Motor Company",
      title: "Software Engineer",
      period: "2021 — 2022",
      summary:
        "Moved safety-critical ADAS prediction logic from MATLAB to C++, and automated the test pipeline behind eight algorithms.",
    },
  ],

  education: [
    {
      school: "University of California, Berkeley",
      detail: "MEng, Robotics & Autonomous Systems",
    },
    {
      school: "University of Illinois Urbana-Champaign",
      detail: "BS Engineering, High Honors",
    },
  ],

  skills: [
    { label: "Languages", items: "Python, Go, Java, C++" },
    { label: "Infrastructure", items: "AWS, Kubernetes, Docker, Terraform" },
    { label: "Data", items: "PostgreSQL, MongoDB, ETL, gRPC / REST / GraphQL" },
    {
      label: "AI tooling",
      items: "Claude Code, Cursor, LLM workflow orchestration",
    },
  ],
} as const;

export type Site = typeof site;
