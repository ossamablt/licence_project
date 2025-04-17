// Mock data for frontend-only version

// Mock tables
export const mockTables = [
  { id: 1, number: 1, seats: 4, status: "occupied" },
  { id: 2, number: 2, seats: 2, status: "occupied" },
  { id: 3, number: 3, seats: 4, status: "occupied" },
  { id: 4, number: 4, seats: 6, status: "free" },
  { id: 5, number: 5, seats: 2, status: "free" },
  { id: 6, number: 6, seats: 8, status: "reserved" },
  { id: 7, number: 7, seats: 4, status: "free" },
  { id: 8, number: 8, seats: 2, status: "free" },
]

// Mock menu items
export const mockMenuItems = [
  {
    id: 1,
    name: "Shawarma Algérienne",
    category: "Plats",
    price: 8.5,
    image: "/placeholder.svg?height=100&width=100",
    options: [
      {
        name: "Sauce",
        choices: ["Harissa", "Mayonnaise", "Algérienne"],
      },
      {
        name: "Extras",
        choices: ["Frites", "Salade", "Oignons"],
      },
    ],
  },
  {
    id: 2,
    name: "Thé à la menthe",
    category: "Boissons",
    price: 2.5,
    image: "/placeholder.svg?height=100&width=100",
    options: [
      {
        name: "Sucre",
        choices: ["Sans sucre", "Peu sucré", "Extra sucre"],
      },
    ],
  },
  {
    id: 3,
    name: "Couscous Royal",
    category: "Plats",
    price: 14.5,
    image: "/placeholder.svg?height=100&width=100",
    options: [
      {
        name: "Viande",
        choices: ["Agneau", "Poulet", "Mixte"],
      },
      {
        name: "Épices",
        choices: ["Doux", "Moyen", "Épicé"],
      },
    ],
  },
  {
    id: 4,
    name: "Tajine de poulet",
    category: "Plats",
    price: 12.0,
    image: "/placeholder.svg?height=100&width=100",
    options: [
      {
        name: "Accompagnement",
        choices: ["Riz", "Semoule", "Pain"],
      },
    ],
  },
  {
    id: 5,
    name: "Café Noir",
    category: "Boissons",
    price: 1.8,
    image: "/placeholder.svg?height=100&width=100",
    options: [
      {
        name: "Sucre",
        choices: ["Sans sucre", "Peu sucré", "Extra sucre"],
      },
    ],
  },
  {
    id: 6,
    name: "Baklava",
    category: "Desserts",
    price: 4.5,
    image: "/placeholder.svg?height=100&width=100",
    options: [
      {
        name: "Portion",
        choices: ["Petite", "Moyenne", "Grande"],
      },
    ],
  },
]

export const menuItems = [
  // Add mock data for menu items here
  { id: 1, name: "Burger", category: "burgers" },
  { id: 2, name: "Fries", category: "sides" },
  { id: 3, name: "Coke", category: "drinks" },
];
// Mock orders
export const mockOrders = [
  {
    id: 1,
    tableNumber: 1,
    time: "10:30",
    status: "preparing",
    items: [
      {
        id: 1,
        name: "Shawarma Algérienne",
        size: "large",
        options: {
          Sauce: "Harissa",
          Extras: "Frites",
        },
        price: 8.5,
      },
      {
        id: 2,
        name: "Thé à la menthe",
        size: "medium",
        options: {
          Sucre: "Extra sucre",
        },
        price: 2.5,
      },
    ],
    total: 11.0,
    notifiedKitchen: true,
    notifiedCashier: false,
  },
  {
    id: 2,
    tableNumber: 2,
    time: "11:15",
    status: "ready",
    items: [
      {
        id: 1,
        name: "Couscous Royal",
        size: "large",
        options: {
          Viande: "Agneau",
          Épices: "Moyen",
        },
        price: 14.5,
      },
    ],
    total: 14.5,
    notifiedKitchen: true,
    notifiedCashier: false,
  },
  {
    id: 3,
    tableNumber: 3,
    time: "11:45",
    status: "pending",
    items: [
      {
        id: 1,
        name: "Tajine de poulet",
        size: "medium",
        options: {
          Accompagnement: "Semoule",
        },
        price: 12.0,
      },
      {
        id: 2,
        name: "Café Noir",
        size: "small",
        options: {
          Sucre: "Peu sucré",
        },
        price: 1.8,
      },
      {
        id: 3,
        name: "Baklava",
        size: "medium",
        options: {
          Portion: "Moyenne",
        },
        price: 4.5,
      },
    ],
    total: 18.3,
    notifiedKitchen: false,
    notifiedCashier: false,
  },
]

