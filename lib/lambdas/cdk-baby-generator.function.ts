import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import OpenAI from 'openai';

const babyPrompts = {
    round: 'a cute baby with a (round) face, chubby cheeks, toothy grin',
    parent: 'a cute baby being held in its mother\'s arms, the mother has a satisfied smile and the baby is joyful',
    pink: 'a cute baby girl in a pink frock, with a crown of pink flowers in her brown hair, she has deep blue eyes',
    silly: 'a cute baby sticking its tongue out with an amused expression on its face, it holds a lego block in its left hand which is raised',
    dog: 'a cute baby crawling in a blue onesie, next to a german shephard dog watching over it, the dog is playing with an orange plastic bone toy, which the baby is intrigued by'
}

const stylePrompts = {
    photograph: 'photo, photograph, raw photo, analog photo, 4k, fujifilm photograph',
    painting: 'Rococo, 1730, late Baroque, Antoine Watteau',
    simpsons: 'in the style of The Simpsons, animated, early 2000s',
    looney_tunes: 'in the style of The Looney Tunes, animated, 1980s',
    child_drawing: 'in the style of a 5 year old child\'s hand drawing using crayons' 
}

// from the DALL-E 2 prompt book at www.dallery.gallery
const lighting = {
    warm: 'Warm lighting, 2700K',
    cold: 'Cold, fluorescent lighting, 4800K',
    high_key: 'High-key lighting, neutral, flat, even, corporate, professional, ambient',
    low_key: 'Low-key lighting, dramatic, single light source, high-contrast',
    backlit: 'Backlighting, backlit',
    golden_hour: 'Golden hour, dusk, sunset, sunrise - warm lighting, strong shadows'
}

// from the DALL-E 2 prompt book at www.dallery.gallery
const smallAndStructured = ['ornate', 'delicate', 'neat', 'precise',
    'detailed', 'opulent', 'lavish', 'elegant',
    'ornamented', 'fine', 'elaborate',
    'accurate', 'intricate', 'meticulous',
    'decorative'
]

const html_content_prefix =
`<!-- For Nav. Never stop obsessing over cute babies - from P <3 -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cute babies!</title>
    <style>
        button {
            background-color: #04AA6D;
            border: none;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);
        }
        .header {
            padding: 20px;
            text-align: center;
            background: #04AA6D;
            color: white;
            font-size: 15px;
            width: 100%;
        }
        body {
            margin: 0;
        }
    </style>
  </head>
  <body>
    <main>
      <div class="header">
        <h1>Cute Baby Generator</h1>
        <p>because why not?</p>
      </div>`;

const html_image_prefix = `<div style="text-align: center;">
        <img src="`;

const html_image_suffix = `" alt="a cute baby!" width="400" height="400">
      </div>`;

const html_content_suffix = `
      <div style="text-align: center; padding: 2em;">
        <a href="https://cutebabygenerator.com/get-cute-baby">
          <button type="button">Generate cute baby!</button>
        </a>
      </div>
    </main>
  </body>
</html>`;

function generatePrompt(): string {
    let prompts: string[] = [];

    // 1% chance of terrible photos
    if (Math.random() < 0.99) {
        prompts.push('A (realistic) close-up');
    }
    
    prompts.push(pickRandomProp(babyPrompts));
    prompts.push(pickRandomProp(lighting));
    prompts.push(pickRandomProp(stylePrompts));

    if (Math.random() < 0.25) {
        prompts = prompts.concat(smallAndStructured);
    }

    const final_prompt = prompts.join(',');
    console.log(`Using prompt: ${final_prompt}`);
    return prompts.join(',');
}

// https://stackoverflow.com/a/15106541
function pickRandomProp(obj: { [key: string]: string; } ) {
    const keys: string[] = Object.keys(obj);
    return obj[keys[keys.length * Math.random() << 0]];
}

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`Event: ${JSON.stringify(event)}`);
    const generate_baby = event.path.includes('get-cute-baby') ? true : false;
    if (!generate_baby) {
        return {
            statusCode: 200,
            body: `${html_content_prefix}${html_content_suffix}`,
            headers: {
                "content-type": "text/html"
            }
        };
    }
    let image_url = '';
    try {
        const openai = new OpenAI();
        const prompt = generatePrompt();
        console.log(`Using prompt: ${prompt}`);
        const image = await openai.images.generate({
            prompt: prompt,
            model: 'dall-e-2',
            n: 1,
            size: '512x512',
        });
        image_url = image?.data[0]?.url ?? '';
    } catch (error) {
        console.log(`error calling OpenAI: ${error}`);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `sorry, we're down right now :(`,
            }),
        }
    }
    console.log(`Got image URL from OpenAI: ${image_url}`);
    return {
        statusCode: 200,
        body: `${html_content_prefix}${html_image_prefix}${image_url}${html_image_suffix}${html_content_suffix}`,
        headers: {
            "content-type": "text/html"
        }
    };
    
};
