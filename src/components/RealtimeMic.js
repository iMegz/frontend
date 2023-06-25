import React, { useState } from "react";
import useMic from "../hooks/useMic";
import Buttons from "./Buttons";
const DURATION = 5 * 1000;
function RealtimeMic() {
    const [isRec, setIsRec] = useState(false);
    const [result, setResult] = useState("");
    const [performance, setPerformance] = useState(null);

    const { init, stop } = useMic(cheating, { onLog });
    function cheating() {}
    function onLog({ text, perf }) {
        setResult(text);
        setPerformance(DURATION / (perf.total_time * 1000));
    }
    function hRecClick() {
        init("<BADBADBAD>");
        setIsRec(true);
    }
    function hStopClick() {
        stop();
        setIsRec(false);
    }
    return (
        <div style={{ textAlign: "center" }}>
            <h1>Realtime Speech Testing</h1>
            <h2>
                <span style={{ color: "purple" }}>Timeslice : </span>
                {DURATION / 1000} s
            </h2>
            <Buttons
                hRecClick={hRecClick}
                hStopClick={hStopClick}
                isRec={isRec}
            />
            <textarea
                readOnly
                value={result}
                placeholder="Click record and let the magic begins"
            />
            <h4>
                <span style={{ color: "purple" }}>Efficiency </span>
                (Duration / Processing time * 100) :
                {performance === null ? " NA" : color(performance)}
            </h4>
        </div>
    );
}

export default RealtimeMic;

function color(value) {
    let color;
    value = ~~(value * 100);
    if (value > 100) color = "green";
    else if (value > 80) color = "orange";
    else color = "red";
    return <span style={{ color }}> {value}%</span>;
}
