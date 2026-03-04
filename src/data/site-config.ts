// ─── Types ───────────────────────────────────────────────────────────────────

export interface MediaItem {
  type: "youtube" | "vimeo" | "video" | "image";
  src: string;
}

export interface Project {
  title: string;
  subtitle: string;
  img: string | null;
  media: MediaItem[];
  desc: string;
  tags: string[];
}

export interface Role {
  title: string;
  date: string;
  desc: string;
}

export interface ExperienceEntry {
  company: string;
  logo: string;
  link: string;
  roles: Role[];
}

export interface Accomplishment {
  title: string;
  img: string | null;
}

export interface Hobby {
  hobby: string;
  description: string;
  img: string | null;
  accomplishments: Accomplishment[];
}

export interface BlogPost {
  title: string;
  date: string;
  content: string;
  media?: MediaItem[];
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface Stat {
  label: string;
  value: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: "linkedin" | "github";
}

export interface SiteConfig {
  name: string;
  tag: string;
  bio: string;
  email: string;
  resume: string;
  skills: SkillGroup[];
  stats: Stat[];
  projects: Project[];
  experience: ExperienceEntry[];
  hobbies: Hobby[];
  blog: BlogPost[];
  social: SocialLink[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const siteConfig: SiteConfig = {
  name: "Maxfield Friedman",
  tag: "Gameplay & XR Engineer",
  bio: "I should tell you a bit about myself\u2026 My lifelong passion for puzzles and building led me to computer science and game development in college. Initially, my goal was simply to build cool stuff. I later realized the greater potential: creating meaningful learning and storytelling platforms. This motivated me to build projects in the XR space and take on new gaming designs via contracting. I thrive on hard challenges that result in unique, meaningful experiences. Currently seeking work, I\u2019m ready to dive headfirst into new challenges and learn what\u2019s needed to find a solution. If interested in my work or if you have an opportunity, please reach out! I look forward to hearing from you.",
  email: "maxfield.friedman12@gmail.com",
  resume: "/assets/MaxfieldFriedmanResume.pdf",

  skills: [
    { group: "Programming", items: ["C#", "C++", "Verse", "Blueprints"] },
    {
      group: "Tools & Engines",
      items: [
        "Unity",
        "Unreal Engine",
        "UEFN",
        "SteamVR",
        "OpenXR",
        "Photon Networking",
      ],
    },
    {
      group: "Disciplines",
      items: [
        "Multiplayer",
        "VR/XR",
        "Gameplay Systems",
        "3D Math",
        "Game AI",
        "UI/UX",
        "Android Mobile Dev",
        "Game Dev",
      ],
    },
  ],

  stats: [
    { label: "Experience", value: "3+ Years" },
    { label: "Engines", value: "Unity | Unreal | UEFN" },
    { label: "Specialty", value: "Gameplay & XR Systems" },
  ],

  projects: [
    {
      title: "Alcon Fidelis Surgical Simulator",
      subtitle: "Worked on at both Elara and Launchvox.",
      img: "/assets/alcon.png",
      media: [
        { type: "video", src: "/assets/fidelis/Fidelis_PromoVideo_v3.mp4" },
        { type: "image", src: "/assets/fidelis/Alcon_SurgicalSimulator2.png" },
      ],
      desc: "A unique surgical simulator experience taking you through the 12 main steps of cataract surgery. My role on the project was to help develop the networking interactions and take on enhancing of a few of the steps in the experience. Specifically, adding visual overlays to rotation steps, adjusting pressure, and motion behavior. On top of that, I worked in collaboration with the team to adjust the main menu flow and connection for the experience.",
      tags: ["Unity", "XR", "Multiplayer", "Complete"],
    },
    {
      title: "Axon Drill Training Simulator",
      subtitle: "Worked on at Elara Systems Inc.",
      img: null,
      media: [],
      desc: "The Axon training simulator was a contracted project we worked on to test the variation in experience between 3D and Stereoscopic video drills. I was tasked with taking on the 3D side of things integrating: a finite state machine, Djikstra's based pathfinding, inverse kinematics, and custom animation flow. It was a great experience to take ownership over a section of a product and really dive into the details to try and make it shine. I learned a lot about problem solving and debugging working on this. If Elara was still around and there was any way to find video reference or code I would!",
      tags: ["Unity", "XR", "Multiplayer", "Game AI", "Complete"],
    },
    {
      title: "Karnivus: Rooftop Rumble",
      subtitle: "Worked on at Force Multiplier.",
      img: "/assets/fmsMedia/KARNIVUS-ROOFTOP-RUMBLE-THUMBNAIL-FINAL-4K.png",
      media: [
        {
          type: "youtube",
          src: "https://www.youtube.com/watch?v=UmTnhErvvPI",
        },
      ],
      desc: "The rooftop rumble experience was a standalone version of the 3rd stage of the Tournament of Champions. For this project I implemented core mechanics like overhauling the quantec behavior, adding wrecking balls, score tracking, and more! If you have fortnite installed, check it out at this island code here: 1086-9838-9592.",
      tags: ["UEFN", "Game Development", "In Progress"],
    },
    {
      title: "Karnivus: Tournament of Champions",
      subtitle: "Worked on at Force Multiplier.",
      img: "/assets/fmsMedia/KARNIVUS_TOC_V1_ALT_FINAL_1920x1080.png",
      media: [
        {
          type: "youtube",
          src: "https://www.youtube.com/watch?v=AVAD8Q7S1QA",
        },
      ],
      desc: "This was the main project I worked on with Force Multiplier. On this project I worked on almost every aspect of the project. From design changes, level adjustments, UI updates, data tracking, mechanics implementation, and deployment. The base project had been built before my time then I came on with an intern for the company and together we took the tournament to the finish line! If you have fortnite installed, check it out at this island code here: 1875-2464-0254.",
      tags: ["UEFN", "Game Development", "Complete"],
    },
    {
      title: "Alcon CS/VCS Experience",
      subtitle: "Worked on at Launchvox.",
      img: "/assets/cs_vcs/thumbnail1.png",
      media: [
        { type: "video", src: "/assets/cs_vcs/vcscsDemo.mp4" },
        { type: "video", src: "/assets/cs_vcs/CS Pops.mp4" },
      ],
      desc: "This experience for Alcon expanded on the base framework for the Fidelis Cataract Simulator. On this project we focused on a new device from Alcon and showing all of the interactions and device attachments that came with it. My job was to implement the networking system using Photon for Unity to allow voice chat and real-time interactions for users. I also worked on the intents and extras system which allow users to view animations build and published in the Unreal Engine while maintaining group networked connection going in and out of the main experience. Check out some of the videos for an idea of what it's like!",
      tags: ["Unity", "Unreal", "XR", "Multiplayer", "Complete"],
    },
  ],

  experience: [
    {
      company: "Force Multiplier Studios",
      logo: "/assets/logos/fmsLogo.png",
      link: "https://www.forcemultiplierstudios.com",
      roles: [
        {
          title: "Gameplay Engineer (Contract)",
          date: "Jul. 2025 - Present",
          desc: "Contracted as a Gameplay Engineer on the Karnivus: Rooftop Rumble and Tournament of Champions experiences for FMS. Developed in UEFN using the Verse programming language. I have been responsible for developing core functionality, build processing, and any other updates needed from debugging to new game flows.",
        },
        {
          title: "Freelance Contractor",
          date: "Jul. 2024 - Jun. 2025",
          desc: "Before coming on to FMS in a larger contract capacity. I used some of my free-time outside of work at Launchvox to learn a bit more about the gaming industry and tackle some different types of challenges I had not seen before with XR work. Though this was sparsely done throughout the week and mostly on the weeks it worked as a great compliment to bring gamification to medical XR and the unique problem solving of XR to games!",
        },
      ],
    },
    {
      company: "Launchvox Inc",
      logo: "/assets/logos/lvLogo.png",
      link: "https://www.launchvox.com/",
      roles: [
        {
          title: "XR Software Engineer",
          date: "Jan. 2024 - Jun. 2025",
          desc: "At Launchvox, I helped develop high-fidelity, bespoke enterprise and medical XR experiences. Utilizing both the Unity and Unreal engine we tackled a range of problems from multiplayer, cross-engine VR to custom UI design with video playback. Through these challenges and more I furthered my knowledge of mobile development, debugging, project deployment, and coding. Tackling tasks with C#, C++, and blueprinting. We covered any combination of engine and headset that a client could throw at us. My time at Launchvox helped me grow immensely as a developer and problem solver. I was able to take more ownership of project components and dabbled with client interactions. Being a small studio we took pride in teamwork and communication. All these things above will be pillars to build on as I continue to grow in my career (More details in resume).",
        },
        {
          title: "Contract Software Engineer",
          date: "Sep. 2023 - Dec. 2023",
          desc: "I began as a contracted engineer for the team. Working on tasks for our primary surgical simulator. I tackled graphing in VR using a heat map plugin, networking, and adjusting interactions for the steps of the primary simulator. This time was a sort of unique job interview and eventually led to my full-time offer with the team after the new year.",
        },
      ],
    },
    {
      company: "Elara Systems Inc",
      logo: "/assets/logos/esiLogo.png",
      link: "https://www.elarasystems.com",
      roles: [
        {
          title: "XR Software Engineer",
          date: "Jan. 2022 - Mar. 2023",
          desc: "Collaborated with a cross-functional team to design and develop interactive XR experiences using Unity or Unreal Engine, tailored to the chosen XR medium. Maintain high-quality standards through version control, consistent formatting practices, and regular progress reporting to the project manager. Actively participate in agile workflows, including code sprints, to ensure timely delivery of enterprise-focused solutions (More details in resume).",
        },
      ],
    },
  ],

  hobbies: [
    {
      hobby: "Running",
      description:
        "A new hobby to the list in 2025. My goal was to run a marathon this year. A literal couch to marathon journey. When I started I couldn't even get a mile in. The ups and downs (there's a lot of hills out there) have helped me grow both mentally and physically stronger. I've seen so much crossover into other aspects of my life that this has become less of a hobby and more of a routine. I'm looking forward to continuing to push myself in the world of endurance to see truly what the body and more importantly, my mind, is capable of! (See some of the races I've done below)",
      img: null,
      accomplishments: [
        { title: "SF Marathon", img: null },
        { title: "Berkeley Half Marathon", img: null },
      ],
    },
    {
      hobby: "Baking and Cooking",
      description:
        "Ever since I was young I've loved being in a kitchen. Yes, the activities themselves are great. I've spent many years combined working in restaurants as well, from dishwasher to server and most positions in the front and back of the house. Both cooking and baking are creative outlets that thrive off experimentation and iteration. They're hard to master and when you get it right, immensely rewarding in flavor. What really keeps this hobby going is what it does for those around me. Food breeds community. People love a good meal. I love making things for others. It really is a win-win. Everyone should do it and everyone can 100% learn to do it!",
      img: null,
      accomplishments: [
        { title: "Banana Bread", img: "/assets/baking/bBread.jpeg" },
        { title: "Tiramisu", img: "/assets/baking/tmisu1.jpeg" },
      ],
    },
  ],

  blog: [
    {
      title: "March Begins!",
      date: "2026-03-01",
      content:
        "Fun work and personal updates coming this month! We're building some new features for St. Patrick's Day at FMS with Rooftop Rumble. My training is ramping up for a future Ironman 70.3. I'm starting a blog/diary that may never be seen. \n\nKeep checking back if you are reading this. More in depth and focused posts coming soon!",
    },
    {
      title: "Welcome to the Dev Diary",
      date: "2026-02-27",
      content:
        "I'm starting a dev diary to share updates on what I'm working on, things I'm learning, and life in general.\n\nStay tuned for posts about game development, XR experiments, and whatever else I'm getting into.",
    },
  ],

  social: [
    {
      label: "LinkedIn",
      href: "https://linkedin.com/in/maxfield-friedman",
      icon: "linkedin",
    },
    {
      label: "GitHub",
      href: "https://github.com/its-maxfield",
      icon: "github",
    },
  ],
};
