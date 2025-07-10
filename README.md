# 🛠️ use-query-factory

Hey! 👋 So I was getting tired of writing the same React Query + Axios boilerplate over and over, so I coded this little utility. Thought you might find it useful too!

## What's this about? 🤔

Basically, I made a `createQueryHook` function that lets you create type-safe React Query hooks without all the repetitive setup. It's nothing fancy - just a nice little helper that I've been copy-pasting into my projects.

**What you can grab from this repo:**
- 📋 **Copy the `createQueryHook` utility** - It's in `src/index.ts`, just copy it into your project and adjust to your requirements if needed!
- 🎨 **Follow the API pattern** - There's a neat way to organize your API calls (`/src/api`) that makes everything super reusable (but totally optional)

## Quick example 🚀

Here's how it works (after you copy the `createQueryHook` function):

```tsx
import { createQueryHook } from './your-utils'; // wherever you put it
import axios from 'axios';

// Create a hook for fetching user data
const useUserQuery = createQueryHook<
  { userId: string },  // What you need to make the request
  { user: User },      // What the API returns
  { include?: string } // Query params (optional)
>({
  url: ({ userId }) => `/users/${userId}`,
  queryFn: async ({ axiosConfig }) => {
    const response = await axios(axiosConfig);
    return response.data;
  }
});

// Use it like any other React Query hook
function UserProfile() {
  const { data, isLoading } = useUserQuery({
    input: { userId: '123' },
    params: { include: 'posts' }
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>Hello {data?.user.name}! 👋</div>;
}
```

## The API pattern I've been using 📁

So here's a cool pattern I stumbled upon - organizing API calls with TypeScript namespaces. You don't *have* to do this, but it's been working really well for me:

```tsx
// src/api/todos/get-one/index.ts
export namespace GetOneTodo {
  export type TInput = { slug: string };
  export type TOutput = { todo: Todo };
  export type TParams = Partial<{ verbose: boolean }>;

  export const url = (slug: string) => `/todos/${slug}`;
  export const useQuery = useTodoQuery; // Your hook instance
}

// src/api/todos/get-one/use-query.ts
export const useTodoQuery = createQueryHook<
  GetOneTodo.TInput,
  GetOneTodo.TOutput,
  GetOneTodo.TParams
>({
  url: ({ slug }) => GetOneTodo.url(slug),
  defaultParams: { verbose: true },
  queryFn: async ({ axiosConfig, params }) => {
    const response = await axios({
      ...axiosConfig,
      params: { verbose: params?.verbose ? '1' : '0' }
    });
    return response.data;
  }
});
```

Then in your components:

```tsx
function TodoPage() {
  const { data, queryKey } = GetOneTodo.useQuery({
    input: { slug: 'my-todo' },
    params: { verbose: false }
  });

  // queryKey is perfect for cache invalidation
  const mutation = useMutation({
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
}
```

Pretty neat, right? Everything's organized and you get full type safety! 🎯

## Some cool features ✨

### Priority system

The hook has this nice priority thing where your component props override the defaults:

```tsx
const usePostsQuery = createQueryHook({
  // Set some defaults
  defaultParams: { page: 1, limit: 10 },
  enabled: false,
  staleTime: 5 * 60 * 1000,
  url: () => '/posts',
  queryFn: async ({ axiosConfig }) => axios(axiosConfig).then(r => r.data)
});

// Override them in your component
const { data } = usePostsQuery({
  input: null,
  params: { page: 2, limit: 20 }, // ✅ Overrides defaults
  enabled: true,                  // ✅ Overrides defaults
  staleTime: 0,                   // ✅ Overrides defaults
});
```

Also sets `refetchOnWindowFocus: false` by default because that's usually what you want 😅

### Parameter transformation

One thing I found super useful - you can transform your nice component props into ugly query string formats:

```tsx
const usePostsQuery = createQueryHook<
  null,
  { posts: Post[] },
  {
    tags: string[];           // Nice array in component
    published: boolean;       // Nice boolean in component
    dateRange: [Date, Date];  // Nice Date objects in component
  }
>({
  url: () => '/posts',
  queryFn: async ({ axiosConfig, params }) => {
    const response = await axios({
      ...axiosConfig,
      params: {
        // Transform to what the API actually wants
        tags: params?.tags?.join(','),
        published: params?.published ? '1' : '0',
        startDate: params?.dateRange?.[0]?.toISOString(),
        endDate: params?.dateRange?.[1]?.toISOString(),
      }
    });
    return response.data;
  }
});

// Your component gets to use nice types
const { data } = usePostsQuery({
  input: null,
  params: {
    tags: ['react', 'typescript'],      // ✅ Array
    published: true,                    // ✅ Boolean
    dateRange: [new Date(), new Date()] // ✅ Date objects
  }
});
```

So your components stay clean but the API gets what it needs! 🎯

## The type parameters

Just a quick breakdown of the generics:

```tsx
createQueryHook<TInput, TOutput, TParams>({...})
```

- **`TInput`** - What you need to build the URL (like IDs, slugs, etc.)
- **`TOutput`** - What the API returns
- **`TParams`** - Query parameters (optional, defaults to `Record<string, unknown>`)

```tsx
createQueryHook<
  { userId: string; postId: string }, // Route params
  { post: Post; author: User },       // API response
  { include: string[]; draft: boolean } // Query params
>({
  url: ({ userId, postId }) => `/users/${userId}/posts/${postId}`,
  queryFn: async ({ axiosConfig, input, params }) => {
    // input and params are fully typed here
    const response = await axios(axiosConfig);
    return response.data;
  }
});
```

## Why the namespace pattern is pretty cool 🤷‍♂️

So that namespace thing I showed earlier? It's actually been working out really well. Here's why:

**Everything looks the same**
```tsx
export namespace GetUser { /* ... */ }
export namespace GetPosts { /* ... */ }
export namespace CreatePost { /* ... */ }
```

**Predictable structure**
- `TInput` - What you need for the request
- `TOutput` - What comes back from the API
- `TParams` - Query parameters
- `url` - URL builder function
- `useQuery` - The actual hook

**Great IntelliSense**
```tsx
const { data } = GetUser.useQuery({ input: { id: '123' } });
const { data } = GetPosts.useQuery({ input: null, params: { page: 1 } });
```

**Scales nicely**
```
src/api/
├── users/
│   ├── get-one/
│   │   ├── index.ts      # GetUser namespace
│   │   └── use-query.ts  # createQueryHook implementation
│   ├── get-many/
│   └── create/
├── posts/
│   ├── get-one/
│   ├── get-many/
│   └── update/
└── comments/
    ├── get-by-post/
    └── create/
```

Once you get used to it, everything just feels consistent and you know exactly where to find stuff! 🎯

## One small gotcha ⚠️

You always need to pass the `input` parameter, even if it's `null`:

```tsx
// ❌ TypeScript will complain
const { data } = usePostsQuery({
  params: { page: 1 }
});

// ✅ Always include input
const { data } = usePostsQuery({
  input: null, // Even if you don't need it!
  params: { page: 1 }
});
```

## Where to find the code 📁

- **Main utility**: `src/createQueryHook.ts` - Copy this into your project!
- **Example usage**: Check out the `src/api/` folder for the namespace pattern examples
- **Tests**: `src/__tests__/` if you want to see how it all works

## Contributing 🤝

If someone wants to create a `createMutationHook` or adapt `createQueryHook` for other HTTP clients (fetch, ky, etc.), I'd totally appreciate a PR!

That's it! Hope this saves you some time like it did for me 😊
