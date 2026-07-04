import { Button, Flex, PasswordInput, Select, Stack, Text, TextInput, Title, Tooltip } from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { ofetch } from 'ofetch'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdaptiveSelect } from '@/components/AdaptiveSelect'
import { PROVIDERS_WITH_PARSE_LINK } from '@/packages/web-search'
import { BochaSearch } from '@/packages/web-search/bocha'
import { QUERIT_SEARCH_URL } from '@/packages/web-search/querit'
import platform from '@/platform'
import { trackJkClickEvent } from '@/analytics/jk'
import { JK_EVENTS, JK_PAGE_NAMES } from '@/analytics/jk-events'
import { useSettingsStore } from '@/stores/settingsStore'

export const Route = createFileRoute('/settings/web-search')({
  component: RouteComponent,
})

export function RouteComponent() {
  const { t } = useTranslation()
  const setSettings = useSettingsStore((state) => state.setSettings)
  const extension = useSettingsStore((state) => state.extension)
  const licenseKey = useSettingsStore((state) => state.licenseKey)

  const [checkingQuerit, setCheckingQuerit] = useState(false)
  const [queritAvailable, setQueritAvailable] = useState<boolean>()
  const checkQuerit = async () => {
    if (extension.webSearch.queritApiKey) {
      setCheckingQuerit(true)
      setQueritAvailable(undefined)
      try {
        await ofetch(QUERIT_SEARCH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${extension.webSearch.queritApiKey}`,
          },
          body: { query: 'Chatbox' },
        })
        setQueritAvailable(true)
      } catch (e) {
        setQueritAvailable(false)
      } finally {
        setCheckingQuerit(false)
      }
    }
  }

  const [checkingBrave, setCheckingBrave] = useState(false)
  const [braveAvailable, setBraveAvailable] = useState<boolean>()
  const checkBrave = async () => {
    if (extension.webSearch.braveApiKey) {
      setCheckingBrave(true)
      setBraveAvailable(undefined)
      try {
        await ofetch('https://api.search.brave.com/res/v1/web/search', {
          headers: { Accept: 'application/json', 'X-Subscription-Token': extension.webSearch.braveApiKey },
          query: { q: 'Chatbox', count: '1' },
        })
        setBraveAvailable(true)
      } catch (e) {
        setBraveAvailable(false)
      } finally {
        setCheckingBrave(false)
      }
    }
  }

  const [checkingKagi, setCheckingKagi] = useState(false)
  const [kagiAvailable, setKagiAvailable] = useState<boolean>()
  const checkKagi = async () => {
    if (extension.webSearch.kagiApiKey) {
      setCheckingKagi(true)
      setKagiAvailable(undefined)
      try {
        await ofetch('https://kagi.com/api/v0/search', {
          headers: { Authorization: `Bot ${extension.webSearch.kagiApiKey}` },
          query: { q: 'Chatbox', limit: '1' },
        })
        setKagiAvailable(true)
      } catch (e) {
        setKagiAvailable(false)
      } finally {
        setCheckingKagi(false)
      }
    }
  }

  const [checkingExa, setCheckingExa] = useState(false)
  const [exaAvailable, setExaAvailable] = useState<boolean>()
  const checkExa = async () => {
    if (extension.webSearch.exaApiKey) {
      setCheckingExa(true)
      setExaAvailable(undefined)
      try {
        await ofetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': extension.webSearch.exaApiKey },
          body: { query: 'Chatbox', numResults: 1 },
        })
        setExaAvailable(true)
      } catch (e) {
        setExaAvailable(false)
      } finally {
        setCheckingExa(false)
      }
    }
  }

  const [checkingGoogle, setCheckingGoogle] = useState(false)
  const [googleAvailable, setGoogleAvailable] = useState<boolean>()
  const checkGoogle = async () => {
    if (extension.webSearch.googleCseApiKey && extension.webSearch.googleCseId) {
      setCheckingGoogle(true)
      setGoogleAvailable(undefined)
      try {
        await ofetch('https://www.googleapis.com/customsearch/v1', {
          query: { key: extension.webSearch.googleCseApiKey, cx: extension.webSearch.googleCseId, q: 'Chatbox', num: '1' },
        })
        setGoogleAvailable(true)
      } catch (e) {
        setGoogleAvailable(false)
      } finally {
        setCheckingGoogle(false)
      }
    }
  }

  const [checkingSearXNG, setCheckingSearXNG] = useState(false)
  const [searxngAvailable, setSearxngAvailable] = useState<boolean>()
  const checkSearXNG = async () => {
    if (extension.webSearch.searxngUrl) {
      setCheckingSearXNG(true)
      setSearxngAvailable(undefined)
      try {
        await ofetch(`${extension.webSearch.searxngUrl.replace(/\/$/, '')}/search`, {
          query: { q: 'Chatbox', format: 'json', categories: 'general' },
        })
        setSearxngAvailable(true)
      } catch (e) {
        setSearxngAvailable(false)
      } finally {
        setCheckingSearXNG(false)
      }
    }
  }

  const [checkingBocha, setCheckingBocha] = useState(false)
  const [bochaAvailable, setBochaAvailable] = useState<boolean>()
  const checkBocha = async () => {
    if (extension.webSearch.bochaApiKey) {
      setCheckingBocha(true)
      setBochaAvailable(undefined)
      try {
        await new BochaSearch(extension.webSearch.bochaApiKey).search('Chatbox')
        setBochaAvailable(true)
      } catch (e) {
        setBochaAvailable(false)
      } finally {
        setCheckingBocha(false)
      }
    }
  }

  const [checkingTavily, setCheckingTavily] = useState(false)
  const [tavilyAvaliable, setTavilyAvaliable] = useState<boolean>()
  const checkTavily = async () => {
    if (extension.webSearch.tavilyApiKey) {
      setCheckingTavily(true)
      setTavilyAvaliable(undefined)
      try {
        await ofetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${extension.webSearch.tavilyApiKey}`,
          },
          body: {
            query: 'Chatbox',
            search_depth: 'basic',
            include_domains: [],
            exclude_domains: [],
          },
        })
        setTavilyAvaliable(true)
      } catch (e) {
        setTavilyAvaliable(false)
      } finally {
        setCheckingTavily(false)
      }
    }
  }

  return (
    <Stack p="md" gap="xxl">
      <Title order={5}>{t('Web Search')}</Title>

      <AdaptiveSelect
        comboboxProps={{ withinPortal: true, withArrow: true }}
        data={[
          { value: 'build-in', label: 'Chatbox AI' },
          { value: 'bing', label: 'Bing Search (Free)' },
          { value: 'duckduckgo', label: 'DuckDuckGo (Free)' },
          { value: 'google', label: 'Google Custom Search' },
          { value: 'brave', label: 'Brave Search' },
          { value: 'kagi', label: 'Kagi' },
          { value: 'exa', label: 'Exa' },
          { value: 'searxng', label: 'SearXNG (Self-hosted)' },
          { value: 'tavily', label: 'Tavily' },
          { value: 'bocha', label: 'BoCha' },
          { value: 'querit', label: 'Querit' },
        ]}
        value={extension.webSearch.provider}
        onChange={(e) =>
          e &&
          setSettings({
            extension: {
              ...extension,
              webSearch: {
                ...extension.webSearch,
                provider: e as 'build-in' | 'bing' | 'tavily' | 'bocha' | 'querit' | 'google' | 'brave' | 'kagi' | 'exa' | 'searxng',
              },
            },
          })
        }
        label={t('Search Provider')}
        maw={320}
      />
      <Stack gap={4}>
        <Text size="xs" c="chatbox-gray">
          {t('Provided tools')}
        </Text>
        {(() => {
          const supportsParseLink = PROVIDERS_WITH_PARSE_LINK.has(extension.webSearch.provider)
          const tools: { label: string; supported: boolean }[] = [
            { label: t('Web Search'), supported: true },
            { label: t('Read Webpage'), supported: supportsParseLink },
          ]
          return tools.map(({ label, supported }) => (
            <Flex key={label} align="center" gap="xs">
              {supported ? (
                <IconCheck size={14} color="var(--mantine-color-chatbox-success-6)" />
              ) : (
                <IconX size={14} color="var(--mantine-color-chatbox-gray-5)" />
              )}
              <Text size="xs" c={supported ? undefined : 'chatbox-gray'}>
                {label}
              </Text>
            </Flex>
          ))
        })()}
      </Stack>
      {extension.webSearch.provider === 'build-in' && (
        <Text size="xs" c="chatbox-gray">
          {t('Chatbox Search is a paid feature with advanced capabilities and better performance.')}
        </Text>
      )}
      {extension.webSearch.provider === 'bing' && (
        <Text size="xs" c="chatbox-gray">
          {t(
            'Bing Search is provided for free use, but it may have limitations and is subject to change by Microsoft.'
          )}
        </Text>
      )}
      {/* Tavily API Key */}
      {extension.webSearch.provider === 'tavily' && (
        <Stack gap="xs">
          <Text fw="600">{t('Tavily API Key')}</Text>
          <Flex align="center" gap="xs">
            <PasswordInput
              flex={1}
              maw={320}
              value={extension.webSearch.tavilyApiKey}
              onChange={(e) => {
                setTavilyAvaliable(undefined)
                setSettings({
                  extension: {
                    ...extension,
                    webSearch: {
                      ...extension.webSearch,
                      tavilyApiKey: e.currentTarget.value,
                    },
                  },
                })
              }}
              error={tavilyAvaliable === false}
            />
            <Button
              color="blue"
              variant="light"
              onClick={checkTavily}
              loading={checkingTavily}
              disabled={!extension.webSearch.tavilyApiKey?.trim()}
            >
              {t('Check')}
            </Button>
          </Flex>

          {typeof tavilyAvaliable === 'boolean' ? (
            tavilyAvaliable ? (
              <Text size="xs" c="chatbox-success">
                {t('Connection successful!')}
              </Text>
            ) : (
              <Text size="xs" c="chatbox-error">
                {t('API key invalid!')}
              </Text>
            )
          ) : null}
          <Button
            variant="transparent"
            size="compact-xs"
            px={0}
            className="self-start"
            onClick={() => platform.openLink('https://app.tavily.com?utm_source=chatbox')}
          >
            {t('Get API Key')}
          </Button>
        </Stack>
      )}
      {/* BoCha API Key */}
      {extension.webSearch.provider === 'bocha' && (
        <Stack gap="xs">
          <Text fw="600">{t('BoCha API Key')}</Text>
          <Flex align="center" gap="xs">
            <PasswordInput
              flex={1}
              maw={320}
              value={extension.webSearch.bochaApiKey}
              onChange={(e) => {
                setBochaAvailable(undefined)
                setSettings({
                  extension: {
                    ...extension,
                    webSearch: {
                      ...extension.webSearch,
                      bochaApiKey: e.currentTarget.value,
                    },
                  },
                })
              }}
              error={bochaAvailable === false}
            />
            <Button
              color="blue"
              variant="light"
              onClick={checkBocha}
              loading={checkingBocha}
              disabled={!extension.webSearch.bochaApiKey?.trim()}
            >
              {t('Check')}
            </Button>
          </Flex>

          {typeof bochaAvailable === 'boolean' ? (
            bochaAvailable ? (
              <Text size="xs" c="chatbox-success">
                {t('Connection successful!')}
              </Text>
            ) : (
              <Text size="xs" c="chatbox-error">
                {t('API key invalid!')}
              </Text>
            )
          ) : null}
          <Button
            variant="transparent"
            size="compact-xs"
            px={0}
            className="self-start"
            onClick={() => platform.openLink('https://open.bochaai.com')}
          >
            {t('Get API Key')}
          </Button>
        </Stack>
      )}
      {/* Querit API Key */}
      {extension.webSearch.provider === 'querit' && (
        <Stack gap="xs">
          <Text fw="600">{t('Querit API Key')}</Text>
          <Flex align="center" gap="xs">
            <PasswordInput
              flex={1}
              maw={320}
              value={extension.webSearch.queritApiKey}
              onChange={(e) => {
                setQueritAvailable(undefined)
                setSettings({
                  extension: {
                    ...extension,
                    webSearch: {
                      ...extension.webSearch,
                      queritApiKey: e.currentTarget.value,
                    },
                  },
                })
              }}
              placeholder={t('Enter your Querit API Key') || 'Enter your Querit API Key'}
              error={queritAvailable === false}
            />
            <Button
              color="blue"
              variant="light"
              onClick={checkQuerit}
              loading={checkingQuerit}
              disabled={!extension.webSearch.queritApiKey?.trim()}
            >
              {t('Check')}
            </Button>
          </Flex>

          {typeof queritAvailable === 'boolean' ? (
            queritAvailable ? (
              <Text size="xs" c="chatbox-success">
                {t('Connection successful!')}
              </Text>
            ) : (
              <Text size="xs" c="chatbox-error">
                {t('API key invalid!')}
              </Text>
            )
          ) : null}

          <Button
            variant="transparent"
            size="compact-xs"
            px={0}
            className="self-start"
            onClick={() => platform.openLink('https://www.querit.ai')}
          >
            {t('Get API Key')}
          </Button>

          {/* Querit Configuration Options */}
          <Stack mt="md" gap="sm">
            <Title order={6}>{t('Querit Search Options')}</Title>

            {/* Max Results */}
            <Stack gap="xs">
              <Flex align="center" gap="xs">
                <Text size="sm">{t('Max Results')}</Text>
                <Tooltip label={t('Maximum number of results to return.')}>
                  <Text size="sm" c="gray">
                    ⓘ
                  </Text>
                </Tooltip>
              </Flex>
              <Select
                comboboxProps={{ withinPortal: true, withArrow: true }}
                data={[
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5' },
                  { value: '6', label: '6' },
                  { value: '7', label: '7' },
                  { value: '8', label: '8' },
                  { value: '9', label: '9' },
                  { value: '10', label: '10' },
                ]}
                value={String(extension.webSearch.queritMaxResults || 5)}
                onChange={(e) =>
                  e &&
                  setSettings({
                    extension: {
                      ...extension,
                      webSearch: {
                        ...extension.webSearch,
                        queritMaxResults: parseInt(e),
                      },
                    },
                  })
                }
                maw={320}
              />
            </Stack>

            {/* Time Range */}
            <Stack gap="xs">
              <Flex align="center" gap="xs">
                <Text size="sm">{t('Time Range')}</Text>
                <Tooltip label={t('Time range of the search. For example, the last month.')}>
                  <Text size="sm" c="gray">
                    ⓘ
                  </Text>
                </Tooltip>
              </Flex>
              <Select
                comboboxProps={{ withinPortal: true, withArrow: true }}
                data={[
                  { value: 'none', label: 'None' },
                  { value: 'd1', label: 'Day' },
                  { value: 'w1', label: 'Week' },
                  { value: 'm1', label: 'Month' },
                  { value: 'y1', label: 'Year' },
                ]}
                value={extension.webSearch.queritTimeRange || 'none'}
                onChange={(e) =>
                  e &&
                  setSettings({
                    extension: {
                      ...extension,
                      webSearch: {
                        ...extension.webSearch,
                        queritTimeRange: e,
                      },
                    },
                  })
                }
                maw={320}
              />
            </Stack>
          </Stack>
        </Stack>
      )}
      {/* Google Custom Search */}
      {extension.webSearch.provider === 'google' && (
        <Stack gap="xs">
          <Text fw="600">{t('Google Custom Search API Key')}</Text>
          <Flex align="center" gap="xs">
            <PasswordInput
              flex={1}
              maw={320}
              value={extension.webSearch.googleCseApiKey}
              onChange={(e) => {
                setGoogleAvailable(undefined)
                setSettings({ extension: { ...extension, webSearch: { ...extension.webSearch, googleCseApiKey: e.currentTarget.value } } })
              }}
              error={googleAvailable === false}
            />
          </Flex>
          <Text fw="600">{t('Search Engine ID (cx)')}</Text>
          <Flex align="center" gap="xs">
            <TextInput
              flex={1}
              maw={320}
              value={extension.webSearch.googleCseId}
              onChange={(e) => {
                setGoogleAvailable(undefined)
                setSettings({ extension: { ...extension, webSearch: { ...extension.webSearch, googleCseId: e.currentTarget.value } } })
              }}
              error={googleAvailable === false}
            />
            <Button color="blue" variant="light" onClick={checkGoogle} loading={checkingGoogle}
              disabled={!extension.webSearch.googleCseApiKey?.trim() || !extension.webSearch.googleCseId?.trim()}>
              {t('Check')}
            </Button>
          </Flex>
          {typeof googleAvailable === 'boolean' ? (
            googleAvailable ? (
              <Text size="xs" c="chatbox-success">{t('Connection successful!')}</Text>
            ) : (
              <Text size="xs" c="chatbox-error">{t('API key or Search Engine ID invalid!')}</Text>
            )
          ) : null}
          <Text size="xs" c="chatbox-gray">
            {t('Create a search engine at Google Programmable Search Engine, set it to "Search the entire web", then copy the Search Engine ID (cx) from its Overview page. The API key comes from Google Cloud Console — the CSE dashboard has a shortcut to it.')}
          </Text>
          <Button variant="transparent" size="compact-xs" px={0} className="self-start"
            onClick={() => platform.openLink('https://programmablesearchengine.google.com/')}>
            {t('Create Search Engine & Get API Key')}
          </Button>
        </Stack>
      )}
      {/* Brave Search API Key */}
      {extension.webSearch.provider === 'brave' && (
        <Stack gap="xs">
          <Text fw="600">{t('Brave Search API Key')}</Text>
          <Flex align="center" gap="xs">
            <PasswordInput
              flex={1}
              maw={320}
              value={extension.webSearch.braveApiKey}
              onChange={(e) => {
                setBraveAvailable(undefined)
                setSettings({ extension: { ...extension, webSearch: { ...extension.webSearch, braveApiKey: e.currentTarget.value } } })
              }}
              error={braveAvailable === false}
            />
            <Button color="blue" variant="light" onClick={checkBrave} loading={checkingBrave}
              disabled={!extension.webSearch.braveApiKey?.trim()}>
              {t('Check')}
            </Button>
          </Flex>
          {typeof braveAvailable === 'boolean' ? (
            braveAvailable ? (
              <Text size="xs" c="chatbox-success">{t('Connection successful!')}</Text>
            ) : (
              <Text size="xs" c="chatbox-error">{t('API key invalid!')}</Text>
            )
          ) : null}
          <Text size="xs" c="chatbox-gray">
            {t('Brave Search is privacy-focused with its own independent web index (not Bing). Free tier: 2,000 queries/month.')}
          </Text>
          <Button variant="transparent" size="compact-xs" px={0} className="self-start"
            onClick={() => platform.openLink('https://brave.com/search/api/')}>
            {t('Get API Key')}
          </Button>
        </Stack>
      )}
      {/* Kagi API Key */}
      {extension.webSearch.provider === 'kagi' && (
        <Stack gap="xs">
          <Text fw="600">{t('Kagi API Key')}</Text>
          <Flex align="center" gap="xs">
            <PasswordInput
              flex={1}
              maw={320}
              value={extension.webSearch.kagiApiKey}
              onChange={(e) => {
                setKagiAvailable(undefined)
                setSettings({ extension: { ...extension, webSearch: { ...extension.webSearch, kagiApiKey: e.currentTarget.value } } })
              }}
              error={kagiAvailable === false}
            />
            <Button color="blue" variant="light" onClick={checkKagi} loading={checkingKagi}
              disabled={!extension.webSearch.kagiApiKey?.trim()}>
              {t('Check')}
            </Button>
          </Flex>
          {typeof kagiAvailable === 'boolean' ? (
            kagiAvailable ? (
              <Text size="xs" c="chatbox-success">{t('Connection successful!')}</Text>
            ) : (
              <Text size="xs" c="chatbox-error">{t('API key invalid!')}</Text>
            )
          ) : null}
          <Text size="xs" c="chatbox-gray">
            {t('Kagi is a paid search engine with no ads and no tracking. Requires an active Kagi subscription; API usage is billed per search.')}
          </Text>
          <Button variant="transparent" size="compact-xs" px={0} className="self-start"
            onClick={() => platform.openLink('https://kagi.com/settings?p=api')}>
            {t('Get API Key')}
          </Button>
        </Stack>
      )}
      {/* Exa API Key */}
      {extension.webSearch.provider === 'exa' && (
        <Stack gap="xs">
          <Text fw="600">{t('Exa API Key')}</Text>
          <Flex align="center" gap="xs">
            <PasswordInput
              flex={1}
              maw={320}
              value={extension.webSearch.exaApiKey}
              onChange={(e) => {
                setExaAvailable(undefined)
                setSettings({ extension: { ...extension, webSearch: { ...extension.webSearch, exaApiKey: e.currentTarget.value } } })
              }}
              error={exaAvailable === false}
            />
            <Button color="blue" variant="light" onClick={checkExa} loading={checkingExa}
              disabled={!extension.webSearch.exaApiKey?.trim()}>
              {t('Check')}
            </Button>
          </Flex>
          {typeof exaAvailable === 'boolean' ? (
            exaAvailable ? (
              <Text size="xs" c="chatbox-success">{t('Connection successful!')}</Text>
            ) : (
              <Text size="xs" c="chatbox-error">{t('API key invalid!')}</Text>
            )
          ) : null}
          <Text size="xs" c="chatbox-gray">{t('Exa uses neural/semantic search — great for research and AI-native queries.')}</Text>
          <Button variant="transparent" size="compact-xs" px={0} className="self-start"
            onClick={() => platform.openLink('https://dashboard.exa.ai/')}>
            {t('Get API Key')}
          </Button>
        </Stack>
      )}
      {/* SearXNG Instance URL */}
      {extension.webSearch.provider === 'searxng' && (
        <Stack gap="xs">
          <Text fw="600">{t('SearXNG Instance URL')}</Text>
          <Flex align="center" gap="xs">
            <TextInput
              flex={1}
              maw={320}
              placeholder="https://searx.example.com"
              value={extension.webSearch.searxngUrl}
              onChange={(e) => {
                setSearxngAvailable(undefined)
                setSettings({ extension: { ...extension, webSearch: { ...extension.webSearch, searxngUrl: e.currentTarget.value } } })
              }}
              error={searxngAvailable === false}
            />
            <Button color="blue" variant="light" onClick={checkSearXNG} loading={checkingSearXNG}
              disabled={!extension.webSearch.searxngUrl?.trim()}>
              {t('Check')}
            </Button>
          </Flex>
          {typeof searxngAvailable === 'boolean' ? (
            searxngAvailable ? (
              <Text size="xs" c="chatbox-success">{t('Connection successful!')}</Text>
            ) : (
              <Text size="xs" c="chatbox-error">{t('Instance unreachable or JSON format not enabled!')}</Text>
            )
          ) : null}
          <Text size="xs" c="chatbox-gray">
            {t('Self-hosted SearXNG instance. Enable JSON format in your instance settings (search.formats: [json]).')}
          </Text>
          <Button variant="transparent" size="compact-xs" px={0} className="self-start"
            onClick={() => platform.openLink('https://searxng.github.io/searxng/')}>
            {t('SearXNG documentation')}
          </Button>
        </Stack>
      )}
      {extension.webSearch.provider !== 'build-in' && !licenseKey && (
        <Tooltip
          label={t(
            'Note: If you have never had a license before, you can claim it after logging in on the official website. Quota refreshed daily.'
          )}
          withArrow
          multiline
          maw={280}
          position="bottom-start"
          styles={{
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
            },
          }}
        >
          <Text
            size="xs"
            className="cursor-pointer"
            onClick={() => {
              trackJkClickEvent(JK_EVENTS.FREE_LICENSE_CLAIM_CLICK, {
                pageName: JK_PAGE_NAMES.SETTING_PAGE,
                content: 'settings_websearch',
              })
              platform.openLink('https://chatboxai.app/login')
            }}
          >
            {t('You can ')}
            <span className="text-blue-500 underline decoration-dotted">{t('try Chatbox AI')}</span>
            {t(' for free now!')}
          </Text>
        </Tooltip>
      )}
    </Stack>
  )
}
