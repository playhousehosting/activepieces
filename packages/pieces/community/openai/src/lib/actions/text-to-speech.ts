import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../..';
import { streamToBuffer } from '../common/common';

type Voice = OpenAI.Audio.Speech.SpeechCreateParams['voice'];
type ResponseFormat = OpenAI.Audio.Speech.SpeechCreateParams['response_format'];

export const textToSpeech = createAction({
  auth: openaiAuth,
  name: 'text_to_speech',
  displayName: 'Text-to-Speech',
  description: 'Generate an audio recording from text',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text you want to hear.',
      required: true,
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description: 'The model which will generate the audio.',
      defaultValue: 'tts-1',
      refreshers: [],
      options: async () => {
        return {
          options: [
            {
              label: 'tts-1',
              value: 'tts-1',
            },
            {
              label: 'tts-1-hd',
              value: 'tts-1-hd',
            },
          ],
        };
      },
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description:
        'The speed of the audio. Minimum is 0.25 and maximum is 4.00.',
      defaultValue: 1.0,
      required: false,
    }),
    voice: Property.Dropdown<Voice>({
      displayName: 'Voice',
      description: 'The voice to generate the audio in.',
      required: true,
      refreshers: [],
      defaultValue: 'alloy',
      options: async () => ({
        options: [
          { label: 'alloy', value: 'alloy' },
          { label: 'echo', value: 'echo' },
          { label: 'fable', value: 'fable' },
          { label: 'onyx', value: 'onyx' },
          { label: 'nova', value: 'nova' },
          { label: 'shimmer', value: 'shimmer' },
        ],
      }),
    }),
    format: Property.Dropdown<ResponseFormat>({
      displayName: 'Output Format',
      required: true,
      description: 'The format you want the audio file in.',
      defaultValue: 'mp3',
      refreshers: [],
      options: async () => ({
        options: [
          { label: 'mp3', value: 'mp3' },
          { label: 'opus', value: 'opus' },
          { label: 'aac', value: 'aac' },
          { label: 'flac', value: 'flac' },
        ],
      }),
    }),
  },
  async run({ auth, propsValue, files }) {
    const openai = new OpenAI({
      apiKey: auth,
    });
    const { voice, format, model, text, speed } = propsValue;

    const audio = await openai.audio.speech.create({
      model: model,
      input: text,
      response_format: format as ResponseFormat,
      voice: voice as Voice,
      speed: speed,
    });
    const result = await streamToBuffer(audio.body);

    return files.write({
      fileName: 'test',
      data: result as Buffer,
    });
  },
});
