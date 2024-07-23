import { useState, useRef, useEffect } from "react";
import "./App.css";
import cv from "@techstark/opencv-js";

function App() {
    const [imageSrc, setImageSrc] = useState("/image.jpg");
    const [processedSrcMask, setProcessedSrcMask] = useState(null);
    const [processedSrc, setProcessedSrc] = useState(null);
    const [contourCount, setContourCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const canvasMaskRef = useRef(null);
    const canvasRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result);
                processImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

	const scrollToResultTitle = () => {
		const resultTitle = document.getElementById("resultTitle");
		if (resultTitle) {
			resultTtile.scrollIntoView();
		}
	}

    const processImage = (src) => {
        setLoading(true);
        // console.log(src);
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const mat = cv.imread(img);
            // let dst = new cv.Mat();
            // let rgbaPlanes = new cv.MatVector();
            const hsvMat = new cv.Mat();
            cv.cvtColor(mat, hsvMat, cv.COLOR_RGB2HSV);

            const lowerBlue = new cv.Mat(
                hsvMat.rows,
                hsvMat.cols,
                hsvMat.type()
            );
            const upperBlue = new cv.Mat(
                hsvMat.rows,
                hsvMat.cols,
                hsvMat.type()
            );
            lowerBlue.setTo([100, 150, 50, 0]);
            upperBlue.setTo([140, 255, 255, 255]);

            const mask = new cv.Mat();
            cv.inRange(hsvMat, lowerBlue, upperBlue, mask);

            cv.imshow(canvasMaskRef.current, mask);
            setProcessedSrcMask(canvasMaskRef.current.toDataURL("image/png"));

            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(
                mask,
                contours,
                hierarchy,
                cv.RETR_EXTERNAL,
                cv.CHAIN_APPROX_SIMPLE
            );

            // Calculate the mean area of the contours
            let totalArea = 0;
            let areas = [];
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                if (area > 10) {
                    totalArea += area;
                    areas.push(area);
                }
            }
            const meanArea = totalArea / areas.length;

            // Set tolerance range for filtering contours based on area
            const tolerance = 0.5; // 50% tolerance
            const minArea = meanArea * (1 - tolerance);
            const maxArea = meanArea * (1 + tolerance);
            let contourCountTemp = 0;
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                if (area > minArea && area < maxArea) {
                    const rect = cv.boundingRect(contour);
                    const point1 = new cv.Point(rect.x, rect.y);
                    const point2 = new cv.Point(
                        rect.x + rect.width,
                        rect.y + rect.height
                    );
                    const color = new cv.Scalar(0, 255, 0, 255);
                    cv.rectangle(mat, point1, point2, color, 5);

                    contourCountTemp++;
                }
            }

            setContourCount(contourCountTemp);

            cv.imshow(canvasRef.current, mat);

            setProcessedSrc(canvasRef.current.toDataURL("image/png"));

            // Release memory
            mat.delete();
            hsvMat.delete();
            lowerBlue.delete();
            upperBlue.delete();
            mask.delete();
            contours.delete();
            hierarchy.delete();

            setLoading(false);
			scrollToResultTitle();
        };
    };

	

    return (
        <div className="App">
            {loading && (
                <div style={{ textAlign: "center", width: "100%", height: "100%", position: "fixed", top: "0", left: "0", backgroundColor: "rgba(0, 0, 0, 0.5)", paddingTop: "10%" }}>
                    <img src={"/loading.gif"} alt="Captured" width={"600"} />
                </div>
            )}
            <h1>Blue Item Detector</h1>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                hidden
            />
            <button onClick={() => fileInputRef.current.click()}>
                Upload Image
            </button>

            <br />
            <br />

            <div>
                {imageSrc && (
                    <img src={imageSrc} alt="Captured" width={"600"} />
                )}
            </div>

            <br />
            <br />
            {contourCount !== 0 && <h1 id="resultTitle">Found {contourCount} objects!</h1>}

            {/*canvases are used to render the images but are innvisible*/}
            <canvas
                ref={canvasMaskRef}
                id="canvasOutputMask"
                style={{ display: "none" }}
            ></canvas>
            <canvas
                ref={canvasRef}
                id="canvasOutput"
                style={{ display: "none" }}
            ></canvas>

            {/*Image outputs*/}
            <div>
                {processedSrcMask && (
                    <img src={processedSrcMask} alt="Processed" width={"600"} />
                )}
            </div>
            <br />
            <div>
                {processedSrc && (
                    <img src={processedSrc} alt="Processed" width={"600"} />
                )}
            </div>
        </div>
    );
}

export default App;
