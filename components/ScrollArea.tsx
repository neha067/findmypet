import { motion,Variants } from "framer-motion";

export default function ScrollArea() {
    return (
        <div className="mt-24 max-w-lg mx-auto pb-24 w-full">
            {food.map(([emoji, hueA, hueB], i) => (
                <Card i={i} emoji={emoji} hueA={hueA} hueB={hueB} key={emoji} />
            ))}
        </div>
    )
}

interface CardProps {
    emoji: string
    hueA: number
    hueB: number
    i: number
}

function Card({ emoji, hueA, hueB, i }: CardProps) {
    // const background = `linear-gradient(306deg, ${hue(hueA)}, ${hue(hueB)})`
    const background = `linear-gradient(306deg, #ffc1e3, #ffffff)`;

    return (
        <motion.div
            className={`card-container-${i} relative flex justify-center items-center overflow-hidden pt-5 mb-[-120px]`}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ amount: 0.8 }}
        >
            <div
                style={{ background }}
                className="absolute top-0 left-0 right-0 bottom-0 clip-path-[path('M 0 303.5 C 0 292.454 8.995 285.101 20 283.5 L 460 219.5 C 470.085 218.033 480 228.454 480 239.5 L 500 430 C 500 441.046 491.046 450 480 450 L 20 450 C 8.954 450 0 441.046 0 430 Z')]"
            />
            <motion.div
                // style={card}
                variants={cardVariants}
                className="text-[164px] w-[300px] h-[430px] flex justify-center items-center rounded-lg bg-[#f5f5f5] shadow-[0_0_1px_hsl(0_0%_0%_/0.075),0_0_2px_hsl(0_0%_0%_/0.075),0_0_4px_hsl(0_0%_0%_/0.075),0_0_8px_hsl(0_0%_0%_/0.075),0_0_16px_hsl(0_0%_0%_/0.075)] transform-origin-[10%_60%] flex justify-center items-center text-6xl rounded-lg bg-[#f5f5f5] shadow-xl"
            >
                {emoji}
            </motion.div>
        </motion.div>
    )
}

const cardVariants: Variants = {
    offscreen: {
        y: 300,
    },
    onscreen: {
        y: 50,
        rotate: -10,
        transition: {
            type: "spring",
            bounce: 0.4,
            duration: 0.8,
        },
    },
}

const hue = (h: number) => `hsl(${h}, 100%, 50%)`

/**
 * ==============   Data   ================
 */

const food: [string, number, number][] = [
    ["🍅", 340, 10],
    ["🍊", 20, 40],
    ["🍋", 60, 90],
    ["🍐", 80, 120],
    ["🍏", 100, 140],
    ["🫐", 205, 245],
    ["🍆", 260, 290],
    ["🍇", 290, 320],
]
