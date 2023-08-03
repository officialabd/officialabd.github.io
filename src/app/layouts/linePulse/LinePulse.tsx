import { useMemo, useState } from "react";

const NetWithPulse = () => {
    const [radius, setRadius] = useState(5);
    const [width, setWidth] = useState(2);

    const createNetArray = () => {
        const size = radius * 2 + 1;
        const net = [];
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                if (i === radius && j === radius) {
                    row.push(1);
                } else if (Math.sqrt((i - radius) ** 2 + (j - radius) ** 2) <= width) {
                    row.push(1);
                } else {
                    row.push(0);
                }
            }
            net.push(row);
        }
        return net;
    };

    const net = useMemo(() => createNetArray(), [radius, width]);

    const renderNet = () => {
        return net.map((row, rowIndex) => (
            <div key={rowIndex}>
                {row.map((cell, cellIndex) => (
                    <span
                        key={cellIndex}
                        className={`w-4 h-4 inline-block ${cell === 1 ? "bg-black" : "bg-transparent"
                            }`}
                    ></span>
                ))}
            </div>
        ));
    };

    return (
        <div>
            <h1>Net with pulse from the center</h1>
            <p>
                Radius: {radius}
                <br />
                Width: {width}
            </p>
            <div className="grid gap-1">{renderNet()}</div>
            <button onClick={() => setRadius(radius + 1)}>Increase radius</button>
            <button onClick={() => setWidth(width + 1)}>Increase width</button>
        </div>
    );
};

export default NetWithPulse;
