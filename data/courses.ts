import { Course } from "@/types/course";

export const courses: Course[] = [
  {
    id: 1,
    title: "Introduction to Python Programming",
    institution: "MIT",
    institutionLogo: "MIT",
    institutionColor: "#A31F34",
    level: "BEGINNER",
    pts: 150,
    bgColor: "from-slate-900 to-slate-700",
    image: "https://quantumzeitgeist.com/wp-content/uploads/python.jpg",
    description:
      "Learn the fundamentals of Python programming, from basic syntax to data structures and algorithms. Build real-world projects and gain hands-on experience with one of the world's most popular programming languages.",
    technologies: [
      { name: "Python", color: "#3776AB" },
      { name: "Jupyter", color: "#F37626" },
    ],
    achievement: "Python Developer",
    locked: false,
    progress: 75,
  },
  {
    id: 2,
    title: "AI Engineer Certification",
    institution: "Stanford",
    institutionLogo: "S",
    institutionColor: "#8C1515",
    level: "INTERMEDIATE",
    pts: 150,
    bgColor: "from-blue-950 to-indigo-800",
    image:
      "https://www.imperial-overseas.com/blog/wp-content/uploads/2023/09/MAUK-01.jpg",
    description:
      "This course comes with comprehensive materials and challenging outcomes for your complete growth. Get your code running and earn the most official badge as a person for education and put cones about your services.",
    technologies: [
      { name: "Python", color: "#3776AB" },
      { name: "PyTorch", color: "#EE4C2C" },
      { name: "AWS", color: "#FF9900" },
      { name: "Git", color: "#F05032" },
    ],
    prerequisite: "Data Structures and Algorithms",
    achievement: "Certified AI Specialist",
    locked: false,
    progress: 35,
  },
  {
    id: 3,
    title: "Full Stack Web Development",
    institution: "Meta",
    institutionLogo: "M",
    institutionColor: "#0082FB",
    level: "ADVANCED",
    pts: 150,
    bgColor: "from-purple-950 to-blue-900",
    image:
      "https://www.htmlpanda.com/blog/wp-content/uploads/2022/03/Comprehensive-Guide-to-Full-Stack-Web-Development-2.png",
    description:
      "Master advanced full-stack development with React, Node.js, and cloud deployment. Build scalable applications and learn enterprise-grade architecture patterns.",
    technologies: [
      { name: "React", color: "#61DAFB" },
      { name: "Node.js", color: "#339933" },
      { name: "PostgreSQL", color: "#336791" },
    ],
    prerequisite: "AI Engineer Certification",
    achievement: "Full Stack Engineer",
    locked: false,
    progress: 100,
  },
  {
    id: 5,
    title: "Full Stack Web Development",
    institution: "Meta",
    institutionLogo: "M",
    institutionColor: "#0082FB",
    level: "INTERMEDIATE",
    pts: 150,
    bgColor: "from-cyan-950 to-blue-800",
    image:
      "https://media.licdn.com/dms/image/v2/D4E0DAQE33NddhaX4RA/learning-public-crop_288_512/learning-public-crop_288_512/0/1736959041356?e=2147483647&v=beta&t=rPNe2JPOO1rbcX0XN5IR3X_PIhWqz0lb6WXCJskJO3M",
    description:
      "Advance your web skills with React, APIs, and database integration. Learn to build dynamic single-page applications and connect them to backend services.",
    technologies: [
      { name: "React", color: "#61DAFB" },
      { name: "Express", color: "#000000" },
      { name: "MongoDB", color: "#47A248" },
    ],
    achievement: "Intermediate Web Developer",
    locked: false,
  },
];
