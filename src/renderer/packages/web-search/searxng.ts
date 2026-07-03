import type { SearchResult } from '@shared/types'
import WebSearch from './base'

type SearXNGResult = {
  title: string
  url: string
  content?: string
}

type SearXNGResponse = {
  results?: SearXNGResult[]
  error?: string
}

export class SearXNGSearch extends WebSearch {
  private instanceUrl: string

  constructor(instanceUrl: string) {
    super()
    this.instanceUrl = instanceUrl.replace(/\/$/, '')
  }

  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const response = (await this.fetch(`${this.instanceUrl}/search`, {
      query: {
        q: query,
        format: 'json',
        categories: 'general',
      },
      signal,
    })) as SearXNGResponse

    const items = (response.results || []).slice(0, 10).map((result) => ({
      title: result.title,
      link: result.url,
      snippet: result.content || '',
    }))

    return { items }
  }
}
