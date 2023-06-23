function Buttons({ hRecClick, hStopClick, hTransClick, isRec, backend }) {
    return (
        <div className="btn-holder">
            <button onClick={hRecClick} disabled={isRec}>
                Record
            </button>
            <button onClick={hStopClick} disabled={!isRec}>
                Stop
            </button>
            <button onClick={hTransClick}>
                {backend ? "Backend" : "Frontend"}
            </button>
        </div>
    );
}

export default Buttons;
