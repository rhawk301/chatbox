import type { SearchResult } from '@shared/types'
import WebSearch from './base'

type KagiResult = {
  t: number // 0 = web result, 1 = related searches
  title?: string
  url?: string
  snippet?: string
}

type KagiResponse = {
  data?: KagiResult[]
  error?: { code: number; msg: string }[]
}

export class KagiSearch extends WebSearch {
  private apiKey: string

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
  }

  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const response = (await this.fetch('https://kagi.com/api/v0/search', {
      headers: {
        Authorization: `Bot ${this.apiKey}`,
      },
      query: {
        q: query,
        limit: '10',
      },
      signal,
    })) as KagiResponse

    if (response.error?.length) {
      throw new Error(`Kagi API error: ${response.error[0].msg}`)
    }

    const items = (response.data || [])
      .filter((r) => r.t === 0 && r.url)
      .map((result) => ({
        title: result.title || '',
        link: result.url!,
        snippet: result.snippet || '',
      }))

    return { items }
  }
}
