/**
 * Factory for creating strongly typed React Query hooks for API requests
 * @module query-hook-factory
 */

import { type QueryFunction, type QueryKey, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { AxiosError, type AxiosRequestConfig } from "axios";

export type AxiosInternalApiError = AxiosError<Partial<{
    error: string;
    statusCode: number;
    message: string;
}>>

/**
 * Function type for generating request URL from input params.
 *
 * Fun fact: At first this type also included "| string" but when you pass url from namespace not as
 * return value of a function you will get an error saying "can't read properties of undefined reading url"
 */
export type QueryKeyUrl<TInput> = (input: TInput) => string;

/**
 * Configuration options for creating a query hook
 * @template TInput - Type of input parameters
 * @template TOutput - Type of query response data
 * @template TParams - Type of URL query parameters
 */
export type FactoryOptions<
    TInput,
    TOutput,
    TParams extends Record<string, unknown> = Record<string, unknown>
> =
    Omit<UseQueryOptions<TOutput, AxiosInternalApiError>, "queryKey" | "queryFn">
    & {
        /** Default URL query parameters */
        defaultParams?: TParams;
        /** Function to generate request URL */
        url: QueryKeyUrl<TInput>;
        /** Query function that makes the actual API request */
        queryFn: (args: {
            input: TInput,
            params?: TParams,
            axiosConfig: Omit<AxiosRequestConfig, "params"> & { params?: TParams }
        } & Parameters<QueryFunction>[0]) => Promise<TOutput> | TOutput;
    };

/**
 * Options for individual query hook instances
 * @template TInput - Type of input parameters
 * @template TOutput - Type of query response data
 * @template TParams - Type of URL query parameters
 */
type InstanceOptions<
    TInput,
    TOutput,
    TParams extends Record<string, unknown> = Record<string, unknown>
> =
    Omit<UseQueryOptions<TOutput, AxiosInternalApiError>, "queryKey" | "queryFn">
    & {
        /** Input parameters for the query */
        input: TInput;
        /** Optional Axios config overrides */
        axiosConfig?: Omit<AxiosRequestConfig, "method" | "params" | "url" | "data">;
        /** URL query parameters */
        params?: TParams;
    }

/**
 * Creates a strongly typed React Query hook for making API requests
 * @template TInput - Type of input parameters
 * @template TOutput - Type of query response data
 * @template TParams - Type of URL query parameters
 * @param options - Configuration options for the query hook
 * @returns A React Query hook function
 */
export const createQueryHook = <
    TInput,
    TOutput,
    TParams extends Record<string, unknown> = Record<string, unknown>
>({ url, queryFn, defaultParams, ...factoryQueryOptions }: FactoryOptions<TInput, TOutput, TParams>) => {
    return ({ input, params, axiosConfig, ...instanceQueryOptions }: InstanceOptions<TInput, TOutput, TParams>) => {
        const requestUrl = typeof url === "string"
            ? url
            : url(input);

        params = params ?? defaultParams;

        // We use method, url and query parameters for query key contruction
        const queryKey: QueryKey = [
            "GET",
            requestUrl,
            params
        ];

        const query = useQuery({
            // Default useQuery options overrides
            refetchOnWindowFocus: false,

            ...factoryQueryOptions,
            ...instanceQueryOptions,
            queryKey,

            queryFn: async (queryFnArgs) => {
                return await queryFn({
                    input,
                    params,

                    // Set default request params so we dont need to duplicate them
                    axiosConfig: {
                        ...axiosConfig,
                        url: requestUrl,
                        method: "GET",
                        params
                    },
                    ...queryFnArgs
                });
            }
        });

        return {
            ...query,

            // Can be used for query invalidation
            queryKey
        };
    };
};
