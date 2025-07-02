import uvicorn


if __name__ == "__main__":
    print("Starting scanner backend server...")
    uvicorn.run("app.app:app", host="0.0.0.0", port=8765, reload=True)
