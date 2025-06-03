import type { QueryKey } from "@tanstack/react-query";
import { Todo } from "../../../entities/todo";
import { useTodosQuery } from "./use-query";

export namespace GetTodos {
    export type TParams = Partial<{
        status: 'complete' | 'incomplete'
        page: string | number | null;
        take: string | number | null;
    }>

    export type TOutput = {
        todos: Todo[];
    }

    export const url = "/todos";

    export const queryKey = (params?: TParams): QueryKey => {
        return ["todos/many", params];
    };

    export const useQuery = useTodosQuery;
}

/**
 * Example usage in a component
 *
 * export function Profile() {
 *   const { data: todo, queryKey } = GetTodos.useQuery({
 *     input: null, // need to pass input even if it is null
 *     params: {
 *         page: 2,
 *         status: 'complete',
 *         take: 5,
 *     }
 * })
 *
 *   ... some mutation code
 *   invalidateQuery: queryKey
 * }
 */
