import type { SearchResult } from '@shared/types'
import WebSearch from './base'

type ExaResult = {
  title?: string
  url: string
  text?: string
  snippet?: string
}

type ExaResponse = {
  results?: ExaResult[]
  error?: string
}

export class ExaSearch extends WebSearch {
  private apiKey: string

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
  }

  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const response = (await this.fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: {
        query,
        numResults: 10,
        useAutoprompt: true,
        type: 'auto',
      },
      signal,
    })) as ExaResponse

    if (response.error) {
      throw new Error(`Exa API error: ${response.error}`)
    }

    const items = (response.results || []).map((result) => ({
      title: result.title || '',
      link: result.url,
      snippet: result.text || result.snippet || '',
    }))

    return { items }
  }
}
