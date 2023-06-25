import { useState } from "react";
import useMic from "../hooks/useMic";
import "./Mic.css";

function Mic() {
    const { init, stop } = useMic(onCheating);
    const [cheating, setCheating] = useState("Not cheating");
    const [isRec, setIsRec] = useState(false);

    function onCheating(text) {
        setCheating(text);
    }
    const text = "What is the chemical symbol for oxygen";

    function start() {
        setIsRec(true);
        init(text);
    }
    function end() {
        stop();
        setIsRec(false);
    }
    return (
        <div style={{ textAlign: "center" }}>
            <h1>Cheating detection</h1>
            <h2 style={{ color: "red" }}>Q : {text}?</h2>
            <div className="btn-holder">
                <button disabled={isRec} onClick={start}>
                    Start
                </button>
                <button disabled={!isRec} onClick={end}>
                    Stop
                </button>
            </div>
            <h2>Cheating Results</h2>
            <p>{cheating}</p>
        </div>
    );
}

export default Mic;
