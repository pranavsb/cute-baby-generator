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

const html_content =
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
    </style>
  </head>
  <body>
    <main>
      <div style="text-align: center; padding: 5em;">
        <img src="https://www.educative.io/static/imgs/logos/logoMarkv2.png" alt="a cute baby!">
      </div>
      <div style="text-align: center; padding: 5em;">
        <a href="https://cutebabygenerator.com"></a>
          <button type="button">Generate cute baby!</button>
        </a>
      </div>
    </main>
  </body>
</html>`;

function generatePrompt(event: APIGatewayEvent): string {
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

    let image_url = '';
    try {
        image_url = 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-nr3WeWHwrFjVZ6mxQyermNsL/cute-baby-generator/img-XS7A6ebE8yVkmi4vDxdOjLRY.png?st=2024-09-15T00%3A08%3A12Z&se=2024-09-15T02%3A08%3A12Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-09-14T23%3A30%3A48Z&ske=2024-09-15T23%3A30%3A48Z&sks=b&skv=2024-08-04&sig=mIf19aq0mrQte7pq%2BmPLK6JrL1dglMMieNQKwfiGdsU%3D';
        // const openai = new OpenAI();
        // const image = await openai.images.generate({
        //     prompt: generatePrompt(event),
        //     model: 'dall-e-3',
        //     n: 1,
        //     size: '1024x1024'
        // });
        // image_url = image?.data[0]?.url ?? '';
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
        body: html_content,
        headers: {
            "content-type": "text/html"
        }
    };
    
};
