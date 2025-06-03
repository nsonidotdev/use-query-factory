# 🏭 React Query Hook Factory

> A TypeScript-first utility function for creating strongly typed React Query hooks with reusable API patterns

## 🚀 What is this?

This is a documented utility function that helps you create type-safe, reusable React Query hooks for your API calls using Axios. Instead of writing the same boilerplate over and over, you define your API structure once and get fully typed hooks that work seamlessly with React Query and Axios.

The `createQueryHook` utility can be extended and customized for your specific use cases, making it a flexible foundation for your Axios-based API layer.

Perfect for developers who want:
- 🎯 **Type safety** - Full TypeScript support with inference
- 🔄 **Reusability** - Define once, use everywhere
- 📦 **Organization** - Clean namespace-based API structure
- ⚡ **DX** - Great developer experience with autocomplete
- 🛠️ **Extensibility** - Customize and extend for your needs

## ⚡ Quick Start

```tsx
import { createQueryHook } from 'use-query-factory';
import axios from 'axios';

// 1. Create your hook factory
const useUserQuery = createQueryHook<
  { userId: string },  // Input type
  { user: User },      // Output type
  { include?: string } // Params type (query params)
>({
  url: ({ userId }) => `/users/${userId}`,
  queryFn: async ({ axiosConfig }) => {
    const response = await axios(axiosConfig);
    return response.data;
  }
});

// 2. Use it in your component
function UserProfile() {
  const { data, isLoading, queryKey } = useUserQuery({
    input: { userId: '123' },
    params: { include: 'posts' }
  });

  if (isLoading) return <div>Loading...</div>;

  return <div>Hello {data?.user.name}! 👋</div>;
}
```

## 📚 Detailed Usage

### 🏗️ Creating Reusable API Calls with Namespaces

The recommended pattern is to organize your API calls using TypeScript namespaces:

```tsx
// src/api/todos/get-one/index.ts
export namespace GetOneTodo {
  export type TInput = {
    slug: string;
  };

  export type TOutput = {
    todo: Todo;
  };

  export type TParams = Partial<{
    verbose: boolean;
  }>;

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
  queryFn: async ({ axiosConfig, input, params }) => {
    const response = await axios({
      ...axiosConfig,
      params: {
        verbose: params?.verbose ? '1' : '0',
      }
    });
    return response.data;
  }
});
```

Then use it in components:

```tsx
function TodoPage() {
  const { data, queryKey } = GetOneTodo.useQuery({
    input: { slug: 'my-todo' },
    params: { verbose: false } // Overrides default
  });

  // Use queryKey for invalidation in mutations
  const mutation = useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });
}
```

### 🎛️ Advanced Features of `createQueryHook`

#### Argument Priority System 🔄

The utility uses a smart priority system where **instance arguments override factory arguments**:

```tsx
const usePostsQuery = createQueryHook({
  // Factory level - these are defaults
  defaultParams: { page: 1, limit: 10 },
  enabled: false,
  staleTime: 5 * 60 * 1000, // 5 minutes

  url: () => '/posts',
  queryFn: async ({ axiosConfig }) => {
    const response = await axios(axiosConfig);
    return response.data;
  }
});

// Instance level - these override factory defaults
const { data } = usePostsQuery({
  input: null,
  params: { page: 2, limit: 20 }, // ✅ Overrides defaultParams
  enabled: true,                  // ✅ Overrides factory enabled
  staleTime: 0,                   // ✅ Overrides factory staleTime
});
```

#### Default Properties 🎯

The factory sets sensible defaults:

```tsx
// These are automatically applied
{
  refetchOnWindowFocus: false, // 🚫 Won't refetch when window gains focus
  // + all your factory options
  // + all your instance options (highest priority)
}
```

#### Parameter Transformation 🔄

A common use case for the `queryFn` is transforming component-friendly parameters into query string-friendly formats:

```tsx
const usePostsQuery = createQueryHook<
  null,
  { posts: Post[] },
  {
    tags: string[];           // Component passes array
    published: boolean;       // Component passes boolean
    dateRange: [Date, Date];  // Component passes Date objects
  }
>({
  url: () => '/posts',
  queryFn: async ({ axiosConfig, params }) => {
    const response = await axios({
      ...axiosConfig,
      params: {
        // Transform array to comma-separated string
        tags: params?.tags?.join(','),

        // Transform boolean to '1'/'0' string
        published: params?.published ? '1' : '0',

        // Transform dates to ISO strings
        startDate: params?.dateRange?.[0]?.toISOString(),
        endDate: params?.dateRange?.[1]?.toISOString(),
      }
    });
    return response.data;
  }
});

// Usage in component with developer-friendly types
const { data } = usePostsQuery({
  input: null,
  params: {
    tags: ['react', 'typescript'],        // ✅ Array
    published: true,                      // ✅ Boolean
    dateRange: [new Date(), new Date()]   // ✅ Date objects
  }
});
```

This pattern lets you keep component interfaces clean while handling the messy details of query string formatting in one place! 🎯

### 🏷️ Type Parameters Explained

```tsx
createQueryHook<TInput, TOutput, TParams>({...})
```

- **`TInput`** 📥 - Shape of data needed to build the request (like route params, IDs)
- **`TOutput`** 📤 - Shape of the API response data
- **`TParams`** 🔍 - Shape of URL query parameters (optional, defaults to `Record<string, unknown>`)

```tsx
// Example with all types
createQueryHook<
  { userId: string; postId: string }, // TInput - route params
  { post: Post; author: User },       // TOutput - API response
  { include: string[]; draft: boolean } // TParams - query params
>({
  url: ({ userId, postId }) => `/users/${userId}/posts/${postId}`,
  queryFn: async ({ axiosConfig, input, params }) => {
    // input is typed as { userId: string; postId: string }
    // params is typed as { include?: string[]; draft?: boolean }
    const response = await axios(axiosConfig);
    return response.data; // Must match TOutput type
  }
});
```

## 🏗️ Reusable API Structure

The namespace pattern demonstrated in this utility creates a consistent, reusable structure for organizing API calls across your application.

### 🎯 Benefits for Development

**Consistency Across Endpoints** 📋
```tsx
// Every API endpoint follows the same pattern
export namespace GetUser { /* ... */ }
export namespace GetPosts { /* ... */ }
export namespace CreatePost { /* ... */ }
```

**Predictable Structure** 🔄
- `TInput` - Always defines what data is needed to make the request
- `TOutput` - Always defines the expected response shape
- `TParams` - Always defines query parameters
- `url` - Always provides the endpoint URL function
- `useQuery` - Always exports the hook for components

**Type Safety at Scale** 🛡️
```tsx
// IntelliSense works perfectly across all endpoints
const { data } = GetUser.useQuery({ input: { id: '123' } });
const { data } = GetPosts.useQuery({ input: null, params: { page: 1 } });
```

### 📈 How It Scales

As your API grows, this pattern scales beautifully:

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

**Developer Benefits** �‍💻
- Instantly recognizable patterns across your codebase
- Consistent structure makes maintenance easier
- Refactoring is safer with strong typing
- API changes are caught at compile time
- Testing follows the same patterns

## ⚠️ Limitations

### Always Pass Input Parameter 📝

Even when your API doesn't need input parameters, you **must** pass the `input` property:

```tsx
// ❌ This will cause TypeScript errors
const { data } = usePostsQuery({
  params: { page: 1 }
});

// ✅ Always include input, even if null
const { data } = usePostsQuery({
  input: null, // Required!
  params: { page: 1 }
});
```

**Happy querying! 🎉**
