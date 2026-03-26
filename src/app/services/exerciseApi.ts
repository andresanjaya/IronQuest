// ExerciseDB API Service
// v1 open-source endpoint

const BASE_URL = 'https://exercisedb.dev/api/v1';

export interface Exercise {
  id: string;
  name: string;
  gifUrl: string;
  target: string;
  bodyPart: string;
  equipment: string;
  secondaryMuscles: string[];
  instructions: string[];
}

export interface PaginatedExercisesResult {
  exercises: Exercise[];
  hasMore: boolean;
}

// Map ExerciseDB body parts to our muscle categories
const BODY_PART_MAP: Record<string, string[]> = {
  push: ['shoulders', 'upper arms'],
  pull: ['upper arms', 'back'],
  chest: ['chest'],
  back: ['back'],
  legs: ['upper legs', 'lower legs', 'waist']
};

// Cache for exercises
let exerciseCache: Exercise[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const PAGE_SIZE = 100;
const EXERCISE_CACHE_STORAGE_KEY = 'ironquest-exercise-cache-v1';

type ApiExercise = {
  exerciseId?: string;
  id?: string;
  name?: string;
  gifUrl?: string;
  targetMuscles?: string[];
  bodyParts?: string[];
  equipments?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  target?: string;
  bodyPart?: string;
  equipment?: string;
};

type ApiEnvelope = {
  data?: unknown;
  exercises?: unknown;
  metadata?: {
    totalExercises?: number;
    totalPages?: number;
    currentPage?: number;
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJsonWithRetry(url: string, init?: RequestInit, retries = 2): Promise<unknown> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, init);

      if (!response.ok) {
        const shouldRetry = response.status === 429 || response.status >= 500;
        if (shouldRetry && attempt < retries) {
          await sleep(500 * (attempt + 1));
          continue;
        }

        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown network error');
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError || new Error('Failed to fetch data');
}

function toExercise(item: ApiExercise): Exercise {
  return {
    id: item.exerciseId || item.id || '',
    name: item.name || 'unknown exercise',
    gifUrl: item.gifUrl || '',
    target: item.target || item.targetMuscles?.[0] || 'unknown',
    bodyPart: item.bodyPart || item.bodyParts?.[0] || 'unknown',
    equipment: item.equipment || item.equipments?.[0] || 'body weight',
    secondaryMuscles: item.secondaryMuscles || [],
    instructions: item.instructions || [],
  };
}

function normalizeExercisesResponse(data: unknown): Exercise[] {
  if (Array.isArray(data)) {
    return data.map((item) => toExercise(item as ApiExercise));
  }

  if (data && typeof data === 'object') {
    const envelope = data as { data?: unknown; exercises?: unknown };
    const raw = envelope.data ?? envelope.exercises;
    if (Array.isArray(raw)) {
      return raw.map((item) => toExercise(item as ApiExercise));
    }
  }

  return [];
}

function mergeUniqueById(exercises: Exercise[]): Exercise[] {
  const uniqueById = new Map<string, Exercise>();

  for (const exercise of exercises) {
    if (!exercise.id) {
      continue;
    }
    uniqueById.set(exercise.id, exercise);
  }

  return Array.from(uniqueById.values());
}

function getPersistedCache(): { data: Exercise[]; timestamp: number } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(EXERCISE_CACHE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { data?: Exercise[]; timestamp?: number };
    if (!Array.isArray(parsed.data) || typeof parsed.timestamp !== 'number') {
      return null;
    }

    return {
      data: parsed.data,
      timestamp: parsed.timestamp,
    };
  } catch (error) {
    console.error('Failed to read persisted exercise cache:', error);
    return null;
  }
}

function setPersistedCache(data: Exercise[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      EXERCISE_CACHE_STORAGE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (error) {
    console.error('Failed to persist exercise cache:', error);
  }
}

function applyCache(data: Exercise[], timestamp = Date.now()) {
  exerciseCache = data;
  cacheTimestamp = timestamp;
}

export async function fetchAllExercises(): Promise<Exercise[]> {
  // Check cache
  if (exerciseCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return exerciseCache;
  }

  const persisted = getPersistedCache();
  if (persisted && Date.now() - persisted.timestamp < CACHE_DURATION) {
    applyCache(persisted.data, persisted.timestamp);
    return persisted.data;
  }

  try {
    const exercises: Exercise[] = [];
    let offset = 0;

    while (true) {
      const data = await fetchJsonWithRetry(`${BASE_URL}/exercises?offset=${offset}&limit=${PAGE_SIZE}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      const pageExercises = normalizeExercisesResponse(data);
      exercises.push(...pageExercises);

      if (pageExercises.length < PAGE_SIZE) {
        break;
      }

      offset += PAGE_SIZE;
    }

    applyCache(exercises);
    setPersistedCache(exercises);
    
    return exercises;
  } catch (error) {
    console.error('Error fetching exercises:', error);

    if (exerciseCache && exerciseCache.length > 0) {
      return exerciseCache;
    }

    if (persisted && persisted.data.length > 0) {
      applyCache(persisted.data, persisted.timestamp);
      return persisted.data;
    }

    // Return mock data if API and cache both fail
    return getMockExercises();
  }
}

export async function getExercisesByBodyPart(bodyPart: string): Promise<Exercise[]> {
  try {
    const data = await fetchJsonWithRetry(`${BASE_URL}/bodyparts/${encodeURIComponent(bodyPart)}/exercises`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    return normalizeExercisesResponse(data);
  } catch (error) {
    console.error(`Error fetching exercises for ${bodyPart}:`, error);
    
    // Fallback to filtering all exercises
    const allExercises = await fetchAllExercises();
    return allExercises.filter(ex => ex.bodyPart.toLowerCase() === bodyPart.toLowerCase());
  }
}

export async function getExercisesByCategory(category: string): Promise<Exercise[]> {
  const bodyParts = BODY_PART_MAP[category] || [];
  
  if (bodyParts.length === 0) {
    return [];
  }

  try {
    // Use bodypart endpoints directly so category lists still work even when
    // all-exercises pagination is rate-limited.
    const groupedResults = await Promise.all(
      bodyParts.map((part) => getExercisesByBodyPart(part))
    );

    const merged = groupedResults.flat();
    const uniqueById = new Map<string, Exercise>();

    for (const exercise of merged) {
      if (!exercise.id) {
        continue;
      }
      uniqueById.set(exercise.id, exercise);
    }

    if (uniqueById.size > 0) {
      return Array.from(uniqueById.values());
    }

    // Fallback to local filtering if bodypart endpoints return empty.
    const allExercises = await fetchAllExercises();
    const filteredFromAll = allExercises.filter(ex => 
      bodyParts.some(part => ex.bodyPart.toLowerCase().includes(part.toLowerCase()))
    );

    if (filteredFromAll.length > 0) {
      return filteredFromAll;
    }

    // Final fallback to curated examples for resilience.
    return getMockExercises().filter(ex =>
      bodyParts.some(part => ex.bodyPart.toLowerCase().includes(part.toLowerCase()))
    );
  } catch (error) {
    console.error(`Error fetching exercises for category ${category}:`, error);
    const bodyParts = BODY_PART_MAP[category] || [];
    return getMockExercises().filter(ex =>
      bodyParts.some(part => ex.bodyPart.toLowerCase().includes(part.toLowerCase()))
    );
  }
}

export async function getExercisesByCategoryPage(
  category: string,
  page: number,
  limit = 10
): Promise<PaginatedExercisesResult> {
  const bodyParts = BODY_PART_MAP[category] || [];

  if (bodyParts.length === 0) {
    return {
      exercises: [],
      hasMore: false,
    };
  }

  const safeLimit = Math.max(1, Math.min(limit, 25));
  const offset = Math.max(0, page) * safeLimit;

  try {
    const filterQuery = encodeURIComponent(bodyParts.join(','));
    const data = (await fetchJsonWithRetry(
      `${BASE_URL}/exercises/filter?bodyParts=${filterQuery}&offset=${offset}&limit=${safeLimit}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )) as ApiEnvelope;

    const merged = mergeUniqueById(normalizeExercisesResponse(data));
    const totalExercises = data.metadata?.totalExercises;
    const hasMore = typeof totalExercises === 'number'
      ? offset + safeLimit < totalExercises
      : merged.length === safeLimit;

    if (merged.length > 0) {
      return {
        exercises: merged,
        hasMore,
      };
    }

    // Fallback when bodypart pagination is unavailable or throttled.
    const allExercises = await fetchAllExercises();
    const filtered = allExercises.filter((ex) =>
      bodyParts.some((part) => ex.bodyPart.toLowerCase().includes(part.toLowerCase()))
    );

    return {
      exercises: filtered.slice(offset, offset + safeLimit),
      hasMore: offset + safeLimit < filtered.length,
    };
  } catch (error) {
    console.error(`Error fetching paginated exercises for category ${category}:`, error);

    const persisted = getPersistedCache();
    const cachedSource = exerciseCache && exerciseCache.length > 0
      ? exerciseCache
      : persisted?.data || [];

    if (cachedSource.length > 0) {
      const filtered = cachedSource.filter((ex) =>
        bodyParts.some((part) => ex.bodyPart.toLowerCase().includes(part.toLowerCase()))
      );

      return {
        exercises: filtered.slice(offset, offset + safeLimit),
        hasMore: offset + safeLimit < filtered.length,
      };
    }

    const fallback = getMockExercises().filter((ex) =>
      bodyParts.some((part) => ex.bodyPart.toLowerCase().includes(part.toLowerCase()))
    );

    return {
      exercises: fallback.slice(offset, offset + safeLimit),
      hasMore: offset + safeLimit < fallback.length,
    };
  }
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const allExercises = await fetchAllExercises();
  
  const searchTerm = query.toLowerCase();
  return allExercises.filter(exercise => 
    exercise.name.toLowerCase().includes(searchTerm) ||
    exercise.target.toLowerCase().includes(searchTerm) ||
    exercise.bodyPart.toLowerCase().includes(searchTerm) ||
    exercise.equipment.toLowerCase().includes(searchTerm)
  );
}

export async function searchExercisesRemote(query: string, limit = 10): Promise<Exercise[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const safeLimit = Math.max(1, Math.min(limit, 25));
    const response = await fetch(
      `${BASE_URL}/exercises/search?q=${encodeURIComponent(trimmed)}&limit=${safeLimit}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return normalizeExercisesResponse(data);
  } catch (error) {
    console.error('Error searching exercises remotely:', error);
    return searchExercises(trimmed);
  }
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  try {
    const data = await fetchJsonWithRetry(`${BASE_URL}/exercises/${encodeURIComponent(id)}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    const normalized = normalizeExercisesResponse(data);
    if (normalized.length > 0) {
      return normalized[0];
    }
  } catch (error) {
    console.error(`Error fetching exercise detail by id ${id}:`, error);
  }

  const allExercises = await fetchAllExercises();
  return allExercises.find(ex => ex.id === id) || null;
}

// Get random exercise for a category
export async function getRandomExercise(category: string): Promise<Exercise | null> {
  const exercises = await getExercisesByCategory(category);
  
  if (exercises.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * exercises.length);
  return exercises[randomIndex];
}

// Mock data fallback
function getMockExercises(): Exercise[] {
  return [
    {
      id: '1',
      name: 'barbell bench press',
      gifUrl: 'https://v2.exercisedb.io/image/xTKmDXVr8dh2UW',
      target: 'pectorals',
      bodyPart: 'chest',
      equipment: 'barbell',
      secondaryMuscles: ['shoulders', 'triceps'],
      instructions: [
        'Lie flat on a bench with your feet on the ground.',
        'Grip the barbell with hands slightly wider than shoulder width.',
        'Lower the bar to your chest.',
        'Press the bar back up to the starting position.'
      ]
    },
    {
      id: '2',
      name: 'barbell squat',
      gifUrl: 'https://v2.exercisedb.io/image/9ueK5Juz1FoQTm',
      target: 'glutes',
      bodyPart: 'upper legs',
      equipment: 'barbell',
      secondaryMuscles: ['quadriceps', 'hamstrings'],
      instructions: [
        'Stand with feet shoulder-width apart.',
        'Place barbell on upper back.',
        'Lower your body by bending knees.',
        'Push through heels to return to start.'
      ]
    },
    {
      id: '3',
      name: 'barbell deadlift',
      gifUrl: 'https://v2.exercisedb.io/image/DlbPGBaTSVQlmz',
      target: 'spine',
      bodyPart: 'back',
      equipment: 'barbell',
      secondaryMuscles: ['glutes', 'hamstrings', 'forearms'],
      instructions: [
        'Stand with feet hip-width apart.',
        'Grip the barbell with hands shoulder-width apart.',
        'Keep your back straight and lift the bar.',
        'Lower the bar back to the ground.'
      ]
    },
    {
      id: '4',
      name: 'shoulder press',
      gifUrl: 'https://v2.exercisedb.io/image/-7exk7GbVxZn5p',
      target: 'delts',
      bodyPart: 'shoulders',
      equipment: 'dumbbell',
      secondaryMuscles: ['triceps', 'upper chest'],
      instructions: [
        'Stand with feet shoulder-width apart.',
        'Hold dumbbells at shoulder height.',
        'Press weights overhead.',
        'Lower back to starting position.'
      ]
    },
    {
      id: '5',
      name: 'lat pulldown',
      gifUrl: 'https://v2.exercisedb.io/image/KAxIRN3hx8N7IQ',
      target: 'lats',
      bodyPart: 'back',
      equipment: 'cable',
      secondaryMuscles: ['biceps', 'rear delts'],
      instructions: [
        'Sit at a lat pulldown machine.',
        'Grip the bar wider than shoulder width.',
        'Pull the bar down to your chest.',
        'Slowly return to starting position.'
      ]
    }
  ];
}
