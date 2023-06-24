import { useEffect, useState } from "react";
import Buttons from "./Buttons";
import { socket } from "../socket";
import "./Mic.css";
import getKeywords from "../utils/keywords";

const DURATION = 5 * 1000;
const OPSR = 16000;
const INSR = 44100;
const textExam = "skip";

function Mic() {
    const [isRec, setIsRec] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [data, setData] = useState(null);
    const [textarea, setTextarea] = useState("");
    const [performance, setPerformance] = useState(null);

    const context = new AudioContext({ sampleRate: INSR });

    // Socket managments
    useEffect(() => {
        // Socket io
        if (!socket.connected) socket.connect();

        socket.on("connected", (data) => console.log("Connected"));
        socket.on("isCheating", handleCheating);
        socket.on("log", handleLog);

        return () => {
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Send audio to the server
    useEffect(() => {
        if (isRec && data) {
            console.log("Data sent to server");
            socket.emit("data", data);
        }
    }, [data, isRec]);

    // Start and end recording, and manage frequent recording calls
    useEffect(() => {
        if (isRec && !recorder) startRecording();
        else if (!isRec && recorder) {
            setRecorder(null);
            setData(null);
            stopRecording(recorder);
        } else if (isRec && recorder) {
            setTimeout(() => {
                stopRecording(recorder);
            }, DURATION);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRec, recorder]);

    function handleCheating(transcription) {
        console.log(transcription);
    }

    function handleLog({ text, perf }) {
        setTextarea(text.trim());
        setPerformance(perf.total_time / (DURATION / 1000));
        console.log(text);
    }

    /**
     * Resample audio buffer
     * @param {AudioBuffer} audioBuffer
     */
    function resample(audioBuffer) {
        const old_sr = audioBuffer.sampleRate;
        const old_length = audioBuffer.length;

        const new_length = (old_length * OPSR) / old_sr;

        const offlineContext = new OfflineAudioContext(1, new_length, OPSR);
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;

        offlineContext.oncomplete = function ({ renderedBuffer }) {
            const audioBlob = renderedBuffer.getChannelData(0);
            const keywords = getKeywords(textExam);
            const data = { audioBlob, keywords };
            setData(data);
        };

        source.connect(offlineContext.destination);
        source.start(0);
        offlineContext.startRendering();
    }

    async function startRecording() {
        const opt = { audio: { sampleRate: INSR, channelCount: 1 } };
        const stream = await navigator.mediaDevices.getUserMedia(opt);
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = async function ({ data }) {
            if (isRec) {
                const opt = { type: "audio/wav" };
                const recordedAudio = new Blob([data], opt);
                const buffer = await recordedAudio.arrayBuffer();
                const audioBuffer = await context.decodeAudioData(buffer);
                resample(audioBuffer);
            }
        };
        recorder.start();
        setRecorder(recorder);
    }

    /**
     *
     * @param {MediaRecorder} recorder
     */
    function stopRecording(recorder) {
        if (recorder && recorder.state === "recording") {
            recorder.stop();
            if (isRec) startRecording();
        }
    }

    // Btn click handlers
    async function hRecClick() {
        if (context.state === "suspended") await context.resume();
        setIsRec(true);
    }

    function hStopClick() {
        setIsRec(false);
        stopRecording();
    }

    function hClearClick() {
        setTextarea("");
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
                hTransClick={hClearClick}
                isRec={isRec}
            />
            <textarea
                readOnly
                value={textarea}
                placeholder="Click record and let the magic begins"
            />
            <h4>
                Efficiency (Processing time / Duration) :{" "}
                {performance === null ? "NA" : color(performance)}
            </h4>
        </div>
    );
}

export default Mic;

function color(value) {
    if (value < 1)
        return <span style={{ color: "green" }}>{~~(value * 1000)}ms</span>;
    else if (value < 2)
        return <span style={{ color: "orange" }}>{value}s</span>;
    else return <span style={{ color: "red" }}>{value}s</span>;
}
