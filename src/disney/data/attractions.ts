import type { Attraction, ParkId } from "../types";

type Seed = Omit<Attraction, "latitude" | "longitude" | "parkId"> & { pos: [number, number] };

const dl: Seed[] = [
  { id: "indiana-jones", name: "Indiana Jones Adventure", land: "Adventureland", pos: [33.8117, -117.9203], lightningLane: true, historicalDemand: "very-high", expectedLlQueueMinutes: 15, durationMinutes: 14 },
  { id: "jungle-cruise", name: "Jungle Cruise", land: "Adventureland", pos: [33.8114, -117.9198], lightningLane: false, historicalDemand: "high", expectedLlQueueMinutes: 10, durationMinutes: 14 },
  { id: "adventureland-treehouse", name: "Adventureland Treehouse", land: "Adventureland", pos: [33.8112, -117.9200], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 5, durationMinutes: 15 },
  { id: "pirates", name: "Pirates of the Caribbean", land: "New Orleans Square", pos: [33.8115, -117.9214], lightningLane: false, historicalDemand: "high", expectedLlQueueMinutes: 10, durationMinutes: 18 },
  { id: "haunted-mansion", name: "Haunted Mansion", land: "New Orleans Square", pos: [33.8118, -117.9220], lightningLane: true, historicalDemand: "high", expectedLlQueueMinutes: 12, durationMinutes: 15 },
  { id: "tianas-bayou", name: "Tiana's Bayou Adventure", land: "Bayou Country", pos: [33.8122, -117.9228], lightningLane: true, historicalDemand: "very-high", expectedLlQueueMinutes: 15, durationMinutes: 18 },
  { id: "winnie-pooh", name: "The Many Adventures of Winnie the Pooh", land: "Bayou Country", pos: [33.8124, -117.9230], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 7, durationMinutes: 10 },
  { id: "rise-resistance", name: "Star Wars: Rise of the Resistance", land: "Galaxy's Edge", pos: [33.8147, -117.9219], lightningLane: false, singlePass: true, historicalDemand: "very-high", expectedLlQueueMinutes: 18, durationMinutes: 25 },
  { id: "millennium-falcon", name: "Millennium Falcon: Smugglers Run", land: "Galaxy's Edge", pos: [33.8140, -117.9208], lightningLane: true, historicalDemand: "high", expectedLlQueueMinutes: 15, durationMinutes: 16 },
  { id: "big-thunder", name: "Big Thunder Mountain Railroad", land: "Frontierland", pos: [33.8126, -117.9207], lightningLane: true, historicalDemand: "high", expectedLlQueueMinutes: 12, durationMinutes: 12 },
  { id: "mark-twain", name: "Mark Twain Riverboat", land: "Frontierland", pos: [33.8120, -117.9204], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 5, durationMinutes: 18 },
  { id: "sailing-ship-columbia", name: "Sailing Ship Columbia", land: "Frontierland", pos: [33.8121, -117.9205], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 5, durationMinutes: 18 },
  { id: "space-mountain", name: "Space Mountain", land: "Tomorrowland", pos: [33.8112, -117.9170], lightningLane: true, historicalDemand: "very-high", expectedLlQueueMinutes: 12, durationMinutes: 13 },
  { id: "star-tours", name: "Star Tours – The Adventures Continue", land: "Tomorrowland", pos: [33.8110, -117.9177], lightningLane: true, historicalDemand: "medium", expectedLlQueueMinutes: 10, durationMinutes: 12 },
  { id: "buzz-lightyear", name: "Buzz Lightyear Astro Blasters", land: "Tomorrowland", pos: [33.8114, -117.9178], lightningLane: true, historicalDemand: "medium", expectedLlQueueMinutes: 10, durationMinutes: 10 },
  { id: "autopia", name: "Autopia", land: "Tomorrowland", pos: [33.8122, -117.9164], lightningLane: true, historicalDemand: "medium", expectedLlQueueMinutes: 12, durationMinutes: 16 },
  { id: "finding-nemo", name: "Finding Nemo Submarine Voyage", land: "Tomorrowland", pos: [33.8120, -117.9172], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 10, durationMinutes: 18 },
  { id: "astro-orbitor", name: "Astro Orbitor", land: "Tomorrowland", pos: [33.8111, -117.9180], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 8, durationMinutes: 10 },
  { id: "matterhorn", name: "Matterhorn Bobsleds", land: "Fantasyland", pos: [33.8133, -117.9178], lightningLane: true, historicalDemand: "high", expectedLlQueueMinutes: 12, durationMinutes: 12 },
  { id: "peter-pan", name: "Peter Pan's Flight", land: "Fantasyland", pos: [33.8130, -117.9192], lightningLane: false, historicalDemand: "very-high", expectedLlQueueMinutes: 10, durationMinutes: 8 },
  { id: "alice", name: "Alice in Wonderland", land: "Fantasyland", pos: [33.8136, -117.9184], lightningLane: false, historicalDemand: "high", expectedLlQueueMinutes: 8, durationMinutes: 9 },
  { id: "mr-toad", name: "Mr. Toad's Wild Ride", land: "Fantasyland", pos: [33.8131, -117.9190], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 8, durationMinutes: 8 },
  { id: "snow-white", name: "Snow White's Enchanted Wish", land: "Fantasyland", pos: [33.8129, -117.9190], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 8, durationMinutes: 8 },
  { id: "pinocchio", name: "Pinocchio's Daring Journey", land: "Fantasyland", pos: [33.8129, -117.9193], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 7, durationMinutes: 8 },
  { id: "small-world", name: "it's a small world", land: "Fantasyland", pos: [33.8148, -117.9180], lightningLane: true, historicalDemand: "medium", expectedLlQueueMinutes: 10, durationMinutes: 18 },
  { id: "dumbo", name: "Dumbo the Flying Elephant", land: "Fantasyland", pos: [33.8137, -117.9191], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 7, durationMinutes: 9 },
  { id: "mad-tea-party", name: "Mad Tea Party", land: "Fantasyland", pos: [33.8137, -117.9185], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 7, durationMinutes: 8 },
  { id: "king-arthur", name: "King Arthur Carrousel", land: "Fantasyland", pos: [33.8133, -117.9192], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 5, durationMinutes: 8 },
  { id: "casey-jr", name: "Casey Jr. Circus Train", land: "Fantasyland", pos: [33.8136, -117.9196], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 7, durationMinutes: 10 },
  { id: "storybook", name: "Storybook Land Canal Boats", land: "Fantasyland", pos: [33.8137, -117.9194], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 7, durationMinutes: 12 },
  { id: "runaway-railway", name: "Mickey & Minnie's Runaway Railway", land: "Mickey's Toontown", pos: [33.8154, -117.9187], lightningLane: true, historicalDemand: "very-high", expectedLlQueueMinutes: 15, durationMinutes: 14 },
  { id: "roger-rabbit", name: "Roger Rabbit's Car Toon Spin", land: "Mickey's Toontown", pos: [33.8154, -117.9191], lightningLane: true, historicalDemand: "medium", expectedLlQueueMinutes: 10, durationMinutes: 10 },
  { id: "gadgetcoaster", name: "Chip 'n' Dale's GADGETcoaster", land: "Mickey's Toontown", pos: [33.8155, -117.9182], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 7, durationMinutes: 8 },
  { id: "disneyland-railroad", name: "Disneyland Railroad", land: "Main Street", pos: [33.8091, -117.9190], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 5, durationMinutes: 22 },
  { id: "main-street-vehicles", name: "Main Street Vehicles", land: "Main Street", pos: [33.8098, -117.9190], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 5, durationMinutes: 10 },
];

const dca: Seed[] = [
  { id: "radiator-springs-racers", name: "Radiator Springs Racers", land: "Cars Land", pos: [33.8050, -117.9187], lightningLane: false, singlePass: true, historicalDemand: "very-high", expectedLlQueueMinutes: 18, durationMinutes: 16 },
  { id: "maters-jamboree", name: "Mater's Junkyard Jamboree", land: "Cars Land", pos: [33.8060, -117.9185], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 7, durationMinutes: 8 },
  { id: "luigis-roadsters", name: "Luigi's Rollickin' Roadsters", land: "Cars Land", pos: [33.8054, -117.9180], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 7, durationMinutes: 9 },
  { id: "guardians", name: "Guardians of the Galaxy – Mission: BREAKOUT!", land: "Avengers Campus", pos: [33.8065, -117.9164], lightningLane: true, historicalDemand: "very-high", expectedLlQueueMinutes: 15, durationMinutes: 13 },
  { id: "web-slingers", name: "WEB SLINGERS: A Spider-Man Adventure", land: "Avengers Campus", pos: [33.8064, -117.9170], lightningLane: true, historicalDemand: "high", expectedLlQueueMinutes: 12, durationMinutes: 13 },
  { id: "incredicoaster", name: "Incredicoaster", land: "Pixar Pier", pos: [33.8047, -117.9218], lightningLane: true, historicalDemand: "high", expectedLlQueueMinutes: 12, durationMinutes: 13 },
  { id: "toy-story-mania", name: "Toy Story Midway Mania!", land: "Pixar Pier", pos: [33.8058, -117.9226], lightningLane: true, historicalDemand: "high", expectedLlQueueMinutes: 12, durationMinutes: 13 },
  { id: "pixar-pal-a-round", name: "Pixar Pal-A-Round", land: "Pixar Pier", pos: [33.8057, -117.9221], lightningLane: false, historicalDemand: "medium", expectedLlQueueMinutes: 8, durationMinutes: 16 },
  { id: "inside-out", name: "Inside Out Emotional Whirlwind", land: "Pixar Pier", pos: [33.8054, -117.9230], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 6, durationMinutes: 8 },
  { id: "jessies-carousel", name: "Jessie's Critter Carousel", land: "Pixar Pier", pos: [33.8056, -117.9228], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 5, durationMinutes: 7 },
  { id: "goofys-sky-school", name: "Goofy's Sky School", land: "Paradise Gardens Park", pos: [33.8038, -117.9210], lightningLane: true, historicalDemand: "medium", expectedLlQueueMinutes: 10, durationMinutes: 9 },
  { id: "little-mermaid", name: "The Little Mermaid – Ariel's Undersea Adventure", land: "Paradise Gardens Park", pos: [33.8047, -117.9201], lightningLane: true, historicalDemand: "low", expectedLlQueueMinutes: 8, durationMinutes: 11 },
  { id: "silly-symphony", name: "Silly Symphony Swings", land: "Paradise Gardens Park", pos: [33.8038, -117.9221], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 6, durationMinutes: 8 },
  { id: "golden-zephyr", name: "Golden Zephyr", land: "Paradise Gardens Park", pos: [33.8043, -117.9212], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 6, durationMinutes: 8 },
  { id: "jumpin-jellyfish", name: "Jumpin' Jellyfish", land: "Paradise Gardens Park", pos: [33.8039, -117.9217], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 5, durationMinutes: 7 },
  { id: "grizzly-river-run", name: "Grizzly River Run", land: "Grizzly Peak", pos: [33.8071, -117.9200], lightningLane: true, historicalDemand: "high", expectedLlQueueMinutes: 12, durationMinutes: 15 },
  { id: "soarin", name: "Soarin' Across America", land: "Grizzly Peak", pos: [33.8082, -117.9194], lightningLane: true, historicalDemand: "high", expectedLlQueueMinutes: 12, durationMinutes: 14 },
  { id: "monsters-inc", name: "Monsters, Inc. Mike & Sulley to the Rescue!", land: "Hollywood Land", pos: [33.8083, -117.9160], lightningLane: true, historicalDemand: "medium", expectedLlQueueMinutes: 10, durationMinutes: 10 },
  { id: "red-car-trolley", name: "Red Car Trolley", land: "Buena Vista Street", pos: [33.8087, -117.9183], lightningLane: false, historicalDemand: "low", expectedLlQueueMinutes: 5, durationMinutes: 15 },
];

const externalEntityIds: Record<string, string> = {
  "indiana-jones": "2aedc657-1ee2-4545-a1ce-14753f28cc66",
  "jungle-cruise": "1b83fda8-d60e-48e4-9a3d-90ddcbcd1001",
  "adventureland-treehouse": "e27b1db8-9ec9-4f8b-9ca6-fd6377de66ee",
  pirates: "82aeb29b-504a-416f-b13f-f41fa5b766aa",
  "haunted-mansion": "ff52cb64-c1d5-4feb-9d43-5dbd429bac81",
  "tianas-bayou": "a9076acd-7630-4bad-a8da-e6bd689ddcac",
  "winnie-pooh": "52a8ef64-d54c-4974-883f-027c3026e3f1",
  "rise-resistance": "34b1d70f-11c4-42df-935e-d5582c9f1a8e",
  "millennium-falcon": "b2c2549c-e9da-4fdd-98ea-1dcff596fed7",
  "big-thunder": "0de1413a-73ee-46cf-af2e-c491cc7c7d3b",
  "mark-twain": "6c30d5b0-8c0a-406f-9258-0b6c55d4a5e4",
  "sailing-ship-columbia": "c9e39189-7e99-4e0a-97e0-4a0d5654d257",
  "space-mountain": "9167db1d-e5e7-46da-a07f-ae30a87bc4c4",
  "star-tours": "cc718d11-fa15-44ee-87d0-ded989ad61bc",
  "buzz-lightyear": "88197808-3c56-4198-a5a4-6066541251cf",
  autopia: "1da85181-bf0f-4ccc-b98e-243142f7347b",
  "finding-nemo": "64d44aaa-6857-4693-b24b-bcff6c6dcfa1",
  "astro-orbitor": "6c225598-91c9-44a3-95e2-7c423475db61",
  matterhorn: "faaa8be9-cc1e-4535-ac20-04a535654bd0",
  "peter-pan": "c23af6ba-8515-406a-8a48-d0818ba0bfc9",
  alice: "a07f3110-013e-43bb-a182-e66bb8b5e28d",
  "mr-toad": "9d401ad3-49b2-469f-ac73-93eb429428fb",
  "snow-white": "4f0053e7-b8db-4833-b02f-35e1c91b4523",
  pinocchio: "90ee50d4-7cc9-4824-b29d-2aac801acc29",
  "small-world": "3638ac09-9fce-4a43-8c79-8ebbe17afce2",
  dumbo: "cc980e8e-192f-48b6-848c-27784084e54b",
  "mad-tea-party": "e0cfed11-96d7-40f3-907f-5cfed172592a",
  "king-arthur": "f7904912-3f08-4563-b99e-fd59f43cc9f2",
  "casey-jr": "8e686e4c-f3db-4d9c-a185-2d54b1fa8899",
  storybook: "cb929138-d77a-4dd2-983c-f651bbd1bd92",
  "runaway-railway": "cd670bff-81d1-4f34-8676-7bafdf49220a",
  "roger-rabbit": "6ce9cdd1-0a43-459e-83cd-f4cace9cfa7b",
  gadgetcoaster: "59647168-d239-4161-8b24-92eb128e96fb",
  "disneyland-railroad": "e2d460e9-2bef-4613-b126-092ab7cb37e5",
  "main-street-vehicles": "bcfd1e17-3eab-4203-b597-6257a257d427",
  "radiator-springs-racers": "c60c768b-3461-465c-8f4f-b44b087506fc",
  "maters-jamboree": "46097afe-a1ea-4807-93d3-14d14f36e55f",
  "luigis-roadsters": "7a09a2f0-e226-4f3e-86f8-2598ab67ec44",
  guardians: "b7678dab-5544-48d5-8fdc-c1a0127cfbcd",
  "web-slingers": "2295351d-ce6b-4c04-92d5-5b416372c5b5",
  incredicoaster: "5d07a2b1-49ca-4de7-9d32-6d08edf69b08",
  "toy-story-mania": "86ab3069-110d-49c5-a7e7-29ddf28695a6",
  "pixar-pal-a-round": "4ca6cdbf-4c5f-45bf-b0dc-db83393ec208",
  "inside-out": "6d876f4c-c3ff-4ae3-a2d8-d4b831e1039b",
  "jessies-carousel": "388ad3f1-5cf5-4a9d-8d0e-6dfb817d7822",
  "goofys-sky-school": "f44a5072-3cda-4c7c-8574-33ad09d16cca",
  "little-mermaid": "e1fbc7a1-2cd1-4282-b373-ac11d9d9d38a",
  "silly-symphony": "4f5b28d0-b78e-482b-8e2e-1f90756d6220",
  "golden-zephyr": "10a5fc6f-5ad3-414b-9bdd-e6bae097b6ad",
  "jumpin-jellyfish": "c8a4b7b1-c1b2-4dfe-b73c-4e834b4a73db",
  "grizzly-river-run": "b1d285a7-2444-4a7c-b7bb-d2d4d6428a85",
  soarin: "77f205a4-d482-4d91-a5ff-71e54a086ad2",
  "monsters-inc": "40524fba-5d84-49e7-9204-f493dbe2d5a4",
};

function hydrate(parkId: ParkId, seeds: Seed[]): Attraction[] {
  return seeds.map(({ pos, ...ride }) => ({ ...ride, parkId, latitude: pos[0], longitude: pos[1], externalEntityId: externalEntityIds[ride.id] }));
}

export const disneylandAttractions = hydrate("disneyland", dl);
export const californiaAdventureAttractions = hydrate("california-adventure", dca);
export const attractions = [...disneylandAttractions, ...californiaAdventureAttractions];

export function attractionsForPark(parkId: ParkId) {
  return parkId === "disneyland" ? disneylandAttractions : californiaAdventureAttractions;
}

export function attractionById(id: string) {
  return attractions.find((attraction) => attraction.id === id);
}

export function landsForPark(parkId: ParkId) {
  return [...new Set(attractionsForPark(parkId).map((attraction) => attraction.land))];
}
