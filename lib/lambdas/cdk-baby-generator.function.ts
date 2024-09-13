import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import OpenAI from 'openai';

const babyPrompts = {
    round: 'a cute baby with a (round) face, chubby cheeks, toothy grin',
    parent: 'a cute baby being held in its mother\'s arms, the mother has a satisfied smile and the baby is joyful',
    pink: 'a cute baby girl in a pink frock, with a crown of pink flowers in her brown hair, she has deep blue eyes',
    silly: 'a cute baby sticking its tongue out with an amused expression on its face, it holds a lego block in its left hand which is raised',
    dog: 'a cute baby crawling in a blue onesie, next to a german shephard dog watching over it, the dog is playing with an orange plastic bone toy, which the baby is intrigued by'
}

const styleSuffixes = {
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

function generatePrompt(event: APIGatewayEvent): string {
    let prompts: string[] = [];

    // 1% chance of terrible photos
    if (Math.random() < 0.99) {
        prompts.push('A (realistic) close-up');
    }
    
    prompts.push(pickRandomProp(babyPrompts));
    prompts.push(pickRandomProp(lighting));
    prompts.push(pickRandomProp(styleSuffixes));

    if (Math.random() < 0.25) {
        prompts = prompts.concat(smallAndStructured);
    }

    return prompts.join(',');
}

// https://stackoverflow.com/a/15106541
function pickRandomProp(obj: Object) {
    const keys = Object.keys(obj);
    return obj[keys[keys.length * Math.random() << 0]];
}

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`Event: ${JSON.stringify(event)}`);
    console.log(`Context: ${JSON.stringify(context)}`);

    let image_url = '';
    try {
        const openai = new OpenAI();
        const image = await openai.images.generate({
            prompt: generatePrompt(event),
            model: 'dall-e-3',
            n: 1,
            size: '1024x1024'
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
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: image_url,
        }),
    };
    
};
