import type { SearchResult } from '@shared/types'
import WebSearch from './base'

type GoogleSearchItem = {
  title: string
  link: string
  snippet?: string
}

type GoogleSearchResponse = {
  items?: GoogleSearchItem[]
  error?: { code: number; message: string }
}

export class GoogleSearch extends WebSearch {
  private apiKey: string
  private cseId: string

  constructor(apiKey: string, cseId: string) {
    super()
    this.apiKey = apiKey
    this.cseId = cseId
  }

  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const response = (await this.fetch('https://www.googleapis.com/customsearch/v1', {
      query: {
        key: this.apiKey,
        cx: this.cseId,
        q: query,
        num: '10',
      },
      signal,
    })) as GoogleSearchResponse

    if (response.error) {
      throw new Error(`Google CSE API error ${response.error.code}: ${response.error.message}`)
    }

    const items = (response.items || []).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet || '',
    }))

    return { items }
  }
}
