import axios from 'axios';

export interface QueryResponse {
    status: string;
    answer: string;
    sources: string[];
}

export interface IngestResponse {
    message: string;
}

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const ingestUrls = async (urls: string[]): Promise<IngestResponse> => {
    try {
        const response = await apiClient.post<IngestResponse>('/ingest-url', { urls });
        return response.data;
    } catch (error) {
        console.error('Error in ingestUrls:', error);
        if (axios.isAxiosError(error)) {
            throw error.response?.data?.detail || 'Failed to process URLs';
        }
        throw 'Failed to process URLs';
    }
};

export const ingestPdf = async (file: File): Promise<IngestResponse> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<IngestResponse>('/ingest-pdf', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error in ingestPdf:', error);
        if (axios.isAxiosError(error)) {
            throw error.response?.data?.detail || 'Failed to process PDF';
        }
        throw 'Failed to process PDF';
    }
}

export const queryChatbot = async (question: string): Promise<QueryResponse> => {
    try {
        const response = await apiClient.post<QueryResponse>('/query', { question });
        return response.data;
    } catch (error) {
        console.error('Error in queryChatbot:', error);
        if (axios.isAxiosError(error)) {
            throw error.response?.data?.detail || 'Failed to get answer from chatbot';
        }
        throw 'Failed to get answer from chatbot';
    }
}