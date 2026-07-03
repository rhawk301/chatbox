import type { SearchResult } from '@shared/types'
import WebSearch from './base'

type BraveWebResult = {
  title: string
  url: string
  description?: string
}

type BraveResponse = {
  web?: {
    results?: BraveWebResult[]
  }
}

export class BraveSearch extends WebSearch {
  private apiKey: string

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
  }

  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const response = (await this.fetch('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': this.apiKey,
      },
      query: {
        q: query,
        count: '10',
      },
      signal,
    })) as BraveResponse

    const items = (response.web?.results || []).map((result) => ({
      title: result.title,
      link: result.url,
      snippet: result.description || '',
    }))

    return { items }
  }
}
