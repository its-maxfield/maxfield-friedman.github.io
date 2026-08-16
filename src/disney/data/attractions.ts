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

function hydrate(parkId: ParkId, seeds: Seed[]): Attraction[] {
  return seeds.map(({ pos, ...ride }) => ({ ...ride, parkId, latitude: pos[0], longitude: pos[1] }));
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
