import React, { useState } from 'react';

function Automation() {
    const [email, setEmail] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [variationCount, setVariationCount] = useState(1);
    const [results, setResults] = useState([]);

    // Load images from R2
    const loadImages = async () => {
        if (!email) {
            alert('Please enter your email');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/list-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                throw new Error('Failed to load images');
            }

            const data = await response.json();

            // Initialize prompts for each image
            const imagesWithPrompts = data.images.map(img => ({
                ...img,
                prompt: '', // User will fill this
                id: Math.random().toString(36),
            }));

            setImages(imagesWithPrompts);

            if (imagesWithPrompts.length === 0) {
                alert('No images found in your folder. Please upload images first.');
            }
        } catch (error) {
            console.error('Error loading images:', error);
            alert('Failed to load images: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Update prompt for specific image
    const updatePrompt = (imageId, newPrompt) => {
        setImages(prev => prev.map(img =>
            img.id === imageId ? { ...img, prompt: newPrompt } : img
        ));
    };

    // Apply same prompt to all images
    const applyPromptToAll = () => {
        const defaultPrompt = prompt('Enter prompt to apply to all images:', 'Enhance this image');
        if (defaultPrompt) {
            setImages(prev => prev.map(img => ({ ...img, prompt: defaultPrompt })));
        }
    };

    // Process all images
    const processAll = async () => {
        const imagesToProcess = images.filter(img => img.prompt.trim());

        if (imagesToProcess.length === 0) {
            alert('Please add prompts to at least one image');
            return;
        }

        setProcessing(true);
        setProgress({ current: 0, total: imagesToProcess.length });
        const allResults = [];

        for (let i = 0; i < imagesToProcess.length; i++) {
            const imageData = imagesToProcess[i];
            setProgress({ current: i + 1, total: imagesToProcess.length });

            try {
                // Fetch the image from R2
                const imageResponse = await fetch(imageData.url);
                const imageBlob = await imageResponse.blob();

                // Create File object from blob
                const imageFile = new File([imageBlob], imageData.filename, {
                    type: imageBlob.type
                });

                // Create FormData
                const formData = new FormData();
                formData.append('prompt', imageData.prompt);
                formData.append('image', imageFile);
                formData.append('email', email);
                formData.append('count', variationCount);

                // Call AI endpoint
                const response = await fetch('/ai', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Failed to process ${imageData.filename}`);
                }

                const data = await response.json();
                const generatedUrls = data.data || [];

                allResults.push({
                    originalName: imageData.filename,
                    originalUrl: imageData.url,
                    prompt: imageData.prompt,
                    results: generatedUrls,
                });

            } catch (error) {
                console.error(`Error processing ${imageData.filename}:`, error);
                allResults.push({
                    originalName: imageData.filename,
                    originalUrl: imageData.url,
                    prompt: imageData.prompt,
                    error: error.message,
                });
            }
        }

        setResults(allResults);
        setProcessing(false);
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>🤖 R2 Batch Automation</h1>
            <p>Process images from your R2 storage automatically</p>

            {/* Email Input */}
            <div style={{ marginBottom: '2rem', padding: '1rem', border: '2px solid #4CAF50', borderRadius: '8px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Your Email:
                </label>
                <input
                    type="email"
                    placeholder="martin_wrede@web.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ padding: '0.5rem', width: '300px', marginRight: '1rem' }}
                />
                <button
                    onClick={loadImages}
                    disabled={loading || !email}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        cursor: loading ? 'wait' : 'pointer',
                        opacity: loading || !email ? 0.6 : 1
                    }}
                >
                    {loading ? 'Loading...' : '📂 Load My Images'}
                </button>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                    Will load images from folder: {email ? email.replace(/[^a-zA-Z0-9]/g, '_') : 'your_email'}
                </p>
            </div>

            {/* Images List */}
            {images.length > 0 && (
                <>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>📸 Images Found: {images.length}</h2>
                        <button
                            onClick={applyPromptToAll}
                            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
                        >
                            Apply Same Prompt to All
                        </button>
                    </div>

                    {/* Variation Selection */}
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                        <label style={{ fontWeight: 'bold', marginRight: '1rem' }}>
                            Variations per image:
                        </label>
                        <label style={{ marginRight: '1rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="variations"
                                value={1}
                                checked={variationCount === 1}
                                onChange={(e) => setVariationCount(parseInt(e.target.value))}
                            />
                            {' '}1 image (fast)
                        </label>
                        <label style={{ marginRight: '1rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="variations"
                                value={2}
                                checked={variationCount === 2}
                                onChange={(e) => setVariationCount(parseInt(e.target.value))}
                            />
                            {' '}2 variations
                        </label>
                        <label style={{ cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="variations"
                                value={4}
                                checked={variationCount === 4}
                                onChange={(e) => setVariationCount(parseInt(e.target.value))}
                            />
                            {' '}4 variations
                        </label>
                    </div>

                    {/* Image Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem',
                        maxHeight: '600px',
                        overflowY: 'auto',
                        padding: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}>
                        {images.map((image) => (
                            <div key={image.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                                <img
                                    src={image.url}
                                    alt={image.filename}
                                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
                                />
                                <p style={{ fontSize: '0.8rem', margin: '0.5rem 0', fontWeight: 'bold' }}>
                                    {image.filename}
                                </p>
                                <textarea
                                    placeholder="Enter prompt for this image..."
                                    value={image.prompt}
                                    onChange={(e) => updatePrompt(image.id, e.target.value)}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        fontSize: '0.9rem',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Process Button */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <button
                            onClick={processAll}
                            disabled={processing || images.every(img => !img.prompt.trim())}
                            style={{
                                padding: '1rem 2rem',
                                fontSize: '1.2rem',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                opacity: processing || images.every(img => !img.prompt.trim()) ? 0.6 : 1
                            }}
                        >
                            {processing
                                ? `⏳ Processing ${progress.current}/${progress.total}...`
                                : `🚀 Process ${images.filter(img => img.prompt.trim()).length} Images`
                            }
                        </button>
                    </div>

                    {/* Progress Bar */}
                    {processing && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                width: '100%',
                                height: '30px',
                                backgroundColor: '#f0f0f0',
                                borderRadius: '15px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${(progress.current / progress.total) * 100}%`,
                                    height: '100%',
                                    backgroundColor: '#4CAF50',
                                    transition: 'width 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}>
                                    {Math.round((progress.current / progress.total) * 100)}%
                                </div>
                            </div>
                            <p style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                Processing image {progress.current} of {progress.total}
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h2>✅ Results ({results.length} images processed)</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1rem'
                    }}>
                        {results.map((result, index) => (
                            <div key={index} style={{ border: '2px solid #4CAF50', padding: '1rem', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>{result.originalName}</h4>
                                <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.5rem 0' }}>
                                    Prompt: {result.prompt}
                                </p>
                                {result.error ? (
                                    <p style={{ color: 'red' }}>❌ Error: {result.error}</p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        {result.results.map((img, imgIndex) => (
                                            <div key={imgIndex}>
                                                <img
                                                    src={img.url}
                                                    alt={`Result ${imgIndex + 1}`}
                                                    style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                                                />
                                                {result.results.length > 1 && (
                                                    <p style={{ fontSize: '0.7rem', textAlign: 'center', margin: '0.25rem 0 0 0' }}>
                                                        Var {imgIndex + 1}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Automation;
