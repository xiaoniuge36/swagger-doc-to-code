/**
 * @name     Multiple status values can be provided with comma separated strings (1)
 * @base     /v2
 * @path     /pet/findByStatus
 * @method   GET
 * @savePath types/swagger-interfaces
 * @update   2025/6/27 02:28:12
 */

declare namespace petFindByStatus {
  interface Params {
    /** Status values that need to be considered for filter -- [default:available] */
    status: ('available' | 'pending' | 'sold')[]
  }

  interface ResponseCategory {
    id?: number
    name?: string
  }

  interface ResponseTagsItem {
    id?: number
    name?: string
  }

  interface Response {
    id?: number
    category?: ResponseCategory
    name: string
    photoUrls: string[]
    tags?: ResponseTagsItem[]
    /** pet status in the store */
    status?: string
  }
}
