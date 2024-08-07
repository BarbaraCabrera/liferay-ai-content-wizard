import { z } from 'zod';

import type {
  APIResponse,
  HookContext,
  PromptInput,
  PromptPayload,
} from '../types';

import { tagSchema as schema } from '../schemas';
import SearchBuilder from '../core/SearchBuilder';
import Asset from './Asset';

export default class TagAsset extends Asset {
  constructor(hookContext: HookContext, promptInput: PromptInput) {
    super(hookContext, promptInput, schema);
  }

  async action(tags: z.infer<typeof schema>) {
    const keywordResponse = await this.hookContext.liferay.getKeywords(
      this.hookContext.themeDisplay.scopeGroupId,
      new URLSearchParams({
        filter: SearchBuilder.in(
          'name',
          tags.map(({ name }) => name)
        ),
      })
    );

    const keywordPage = await keywordResponse.json<APIResponse>();
    const keywords = keywordPage.items.map(({ name }) => name);
    const filteredTags = tags.filter(({ name }) => !keywords.includes(name));

    await Promise.all(
      filteredTags.map((tag) =>
        this.hookContext.liferay.createKeyword(
          this.hookContext.themeDisplay.scopeGroupId,
          tag.name
        )
      )
    );
  }

  getPrompt({ amount, subject }: PromptInput): PromptPayload {
    return {
      instruction:
        'You are a system administrator responsible for creating tags for your company.',
      prompt: `Create a list of ${amount} tags about ${subject}`,
      schema,
    };
  }
}
