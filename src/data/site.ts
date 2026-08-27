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
    "I work on the infrastructure behind autonomous vehicle development — the pipelines that turn raw sensor logs into maps, the systems that schedule and run simulations at scale, and the tooling engineers reach for when they want to get work done without fighting the platform.",
    "Most of what I build is invisible when it works. A mapping platform that batch-processes a thousand jobs a week. A spatial index that turns an hours-long query into a minutes-long one. A cost pipeline that makes a six-figure line item legible enough to act on. The problems I find interesting are almost always about turning something slow, opaque, or manual into something fast, inspectable, and self-service.",
    "Before Applied I was at Shelton AI in Berkeley, and at Ford in Dearborn, where I moved safety-critical ADAS prediction logic out of MATLAB and into C++. I studied Robotics and Autonomous Systems at Berkeley and engineering at Illinois.",
    "Outside work I build small iOS apps, mostly to find out how far a local-first app with no backend can actually go.",
  ],

  experience: [
    {
      company: "Applied Intuition",
      title: "Senior Software Engineer",
      period: "Oct 2025 — Present",
      location: "Mountain View, CA",
      bullets: [
        "Led the mapping architecture transformation across the Autonomy, Triage, and Tooling teams, deprecating legacy converters and establishing DMP as the company-wide standard for map data.",
        "Built a production LiDAR SLAM point-cloud mapping platform on Flyte that batch-processes over 1,000 map-generation jobs a week, cited by leadership as the scaling mechanism for OEM map validation.",
        "Shipped a self-service SLAM launch platform with N-way parallel execution and built-in P50/P90 and error-rate monitoring, now used by external OEM contractors to generate hundreds of production map layers.",
        "Built an agentic developer platform on Claude Code and Cursor that automates the Jira-ticket-to-merged-PR lifecycle, cutting ticket-to-PR time by 10x.",
        "Built a Maps Lane diff tool that replaced reading million-line changesets with visual tile inspection, improving review efficiency by 60%.",
      ],
    },
    {
      company: "Applied Intuition",
      title: "Software Engineer II",
      period: "Jul 2023 — Oct 2025",
      location: "Mountain View, CA",
      bullets: [
        "Architected an end-to-end simulation modality across four engineering teams, feeding stack outputs into drivelog resimulation so customers could see quarter-over-quarter performance movement directly.",
        "Led incident response for critical CI outages affecting 100+ engineers across the US and Japan, and the debugging and communication protocols that cut resolution time by 60% afterward.",
        "Replaced a spatial query bottleneck with KD-tree indexing for a 20x speedup, taking pipeline processing from hours to minutes.",
        "Designed a high-availability ETL pipeline joining AWS cost data to internal simulation metrics, processing 1,000+ records daily and surfacing more than $200K in annual savings.",
      ],
    },
    {
      company: "Shelton AI",
      title: "Software Engineer",
      period: "Aug 2022 — Jul 2023",
      location: "Berkeley, CA",
      bullets: [
        "Led five engineers on spaCy-based NLP work, shipping interactive tooling that improved experimental velocity by 60%.",
        "Built a Python and Pandas data pipeline over 10,000+ points, along with the metrics framework that accelerated model iteration by 40%.",
      ],
    },
    {
      company: "Ford Motor Company",
      title: "Software Engineer",
      period: "Jul 2021 — Aug 2022",
      location: "Dearborn, MI",
      bullets: [
        "Migrated target-classification prediction logic from MATLAB to C++ for a 10x speedup in safety-critical code.",
        "Led CI/CD test automation across eight ADAS algorithms, cutting testing cycle time by 70%.",
      ],
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
    { label: "AI tooling", items: "Claude Code, Cursor, LLM workflow orchestration" },
  ],
} as const;

export type Site = typeof site;
