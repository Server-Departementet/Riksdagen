import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
    message: string
}

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    console.log("API request received", req.query.code);

    fetch("http://localhost:4000/api/oauth/discord", {
        method: "POST",
        body: JSON.stringify({ code: req.query.code }),
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");

            return response.json();
        })
        .then(data => {
            console.info("Success:", data);

            // Redirect to home page
            res.redirect("/?oauth=success");
        })
        .catch(error => {
            console.error("Error:", error);
            res.status(500).json({ message: "Internal server error" });
        });
}