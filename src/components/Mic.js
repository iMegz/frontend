import { useEffect, useState } from "react";
import Buttons from "./Buttons";
import { socket } from "../socket";
import "./Mic.css";
import Table from "./Table";
import getKeywords from "../utils/keywords";

const OUTPUT_SAMPLE_RATE = 16000;
const INPUT_SAMPLE_RATE = 44100;
const text = "What is the chemical symbol for Oxygen ?";

function Mic() {
    console.log();
    const [isRec, setIsRec] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [mySocket, setMySocket] = useState(null);
    const [ort, setOrt] = useState(null);
    const [onnx, setOnnx] = useState(null);
    const [onnxQuant, setOnnxQuant] = useState(null);
    const [backend, setBackend] = useState(true);

    const [audioDuration, setAudioDuration] = useState("NA");

    const context = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });

    /**
     *
     * @param {Float32Array} audioData
     */
    function onRecord(audio_blob) {
        console.log("Send record");
        const bytes = audio_blob.length * Float32Array.BYTES_PER_ELEMENT;
        const KB = bytes / 1024;
        console.log(KB);
        const keywords = getKeywords(text);
        console.log(keywords);
        const data = { audio_blob, keywords };
        socket.emit("data", data);
    }

    useEffect(() => {
        // Socket io
        if (!socket.connected) {
            socket.connect();
        }
        setMySocket(socket);
        // For testing purposes
        // socket.on("result", function ({ text, perf, model }) {
        //     if (model === "ORT") setOrt(perf);
        //     else if (model === "ONNX") setOnnx(perf);
        //     else if (model === "ONNXQ") setOnnxQuant(perf);
        // });
        socket.on("connected", function (data) {
            console.log(data);
        });
        socket.on("isCheating", function (data) {
            console.log(data);
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    async function startRecording() {
        try {
            const opt = {
                audio: { sampleRate: INPUT_SAMPLE_RATE, channelCount: 1 },
            };
            const stream = await navigator.mediaDevices.getUserMedia(opt);
            await context.resume();

            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorder.addEventListener("dataavailable", ({ data }) => {
                if (data.size > 0) chunks.push(data);
            });

            mediaRecorder.addEventListener("stop", async () => {
                const opt = { type: "audio/wav" };
                const recordedAudio = new Blob(chunks, opt);
                const buffer = await recordedAudio.arrayBuffer();
                const audioBuffer = await context.decodeAudioData(buffer);

                const old_sr = audioBuffer.sampleRate;
                const old_length = audioBuffer.length;

                const new_length = (old_length * OUTPUT_SAMPLE_RATE) / old_sr;

                const offlineContext = new OfflineAudioContext(
                    1,
                    new_length,
                    OUTPUT_SAMPLE_RATE
                );
                const source = offlineContext.createBufferSource();
                source.buffer = audioBuffer;

                offlineContext.oncomplete = ({ renderedBuffer }) => {
                    const audioData = renderedBuffer.getChannelData(0);
                    const duration = ~~(audioBuffer.duration * 100) / 100;
                    console.log(`Audio duration = ${duration}`);
                    setAudioDuration(duration);
                    onRecord(audioData);
                };

                source.connect(offlineContext.destination);
                source.start(0);
                offlineContext.startRendering();

                setIsRec(false);
                // setRecord(recordedAudio);
            });

            mediaRecorder.start();
            setRecorder(mediaRecorder);
            setIsRec(true);
        } catch (error) {
            console.log("Media device access failed", error);
        }
    }

    function stopRecording() {
        if (recorder && recorder.state === "recording") {
            recorder.stop();
        }
    }

    // Btn click handlers
    function hRecClick() {
        startRecording();
    }
    function hStopClick() {
        stopRecording();
    }
    function hTransClick() {
        setBackend((prev) => !prev);
    }
    const style = { textAlign: "start", paddingLeft: "40px" };

    return (
        <div style={{ textAlign: "center" }}>
            <h1>Models Performance Testing</h1>

            <Buttons
                hRecClick={hRecClick}
                hStopClick={hStopClick}
                hTransClick={hTransClick}
                isRec={isRec}
                backend={backend}
            />
            <h3 style={{ marginBottom: "5px", ...style }}>
                <span style={{ color: "blue" }}>Text = </span>
                {text}
            </h3>
            <h4 style={{ marginTop: 0, ...style }}>
                <span style={{ color: "blue" }}>Audio duration = </span>
                {audioDuration}
            </h4>

            <div className="results-holder">
                <Table title={"ONNX"} perf={onnx} />
                <Table title={"Quantized ONNX"} perf={onnxQuant} />
                <Table title={"ORT"} perf={ort} />
            </div>
        </div>
    );
}

export default Mic;
