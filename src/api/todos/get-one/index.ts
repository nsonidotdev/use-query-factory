import { type QueryKey } from "@tanstack/react-query";
import { useTodoQuery  } from "./use-query";
import { Todo } from "../../../entities/todo";

export namespace GetOneTodo {
    export const url = (slug: string) => `/todos/${slug}`;
    export const method = "GET";

    export type TParams = Partial<{
        verbose: boolean;
    }>

    export type TInput = {
        slug: string;
    }

    export type TOutput = {
        todo: Todo;
    }

    export const queryKey = (slug: string, params?: TParams): QueryKey => {
        return ['get/todos', slug, params];
    };

    export const queryParams = (params?: TParams) => params;

    export const useQuery = useTodoQuery;
}

/**
 * Example usage in a component
 *
 * export function TodoPage() {
 *   const { data: todo, queryKey } = GetOneTodo.useQuery({
 *     input: { slug: 'todo1' },
 *     params: { verbose: true }
 *   })
 * }
 */
