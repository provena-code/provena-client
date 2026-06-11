import { DefaultService } from "@/api";
import { getEmailFromAnonID } from "@/lib/anon";
import { useQuery } from "@tanstack/react-query";

interface TimeRangeSelectorProps {
  subjectId: string;
}

/**
 * Allows the user to select a start and end time using a date/time widget, forming a range.
 * A button allow the user to submit the selected range, navigating to a page showing the events in that range.
 */
export default function TimeRangeSelector({ subjectId }: TimeRangeSelectorProps) {

    const { data, isLoading, isError } = useQuery({
        queryKey: ['timeRange', subjectId],
        queryFn: () => DefaultService.getClientTimestampRangeForSubject(getEmailFromAnonID(subjectId)!),
        enabled: !!subjectId,
    });

    const { MinClientTimestamp, MaxClientTimestamp } = data || {};
    // parse ISO strings into a format suitable for the datetime-local input
    const parseTimeForInput = (time: string | undefined) => {
        if (!time) return '';
        const date = new Date(time);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
    };
    const defaultStartTime = parseTimeForInput(MinClientTimestamp);
    const defaultEndTime = parseTimeForInput(MaxClientTimestamp);

    return (
        <div className="p-4 border-t border-gray-300 flex-grow flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Select Time Range</h3>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-2">
                    <label htmlFor="start-time" className="text-sm font-medium text-gray-700">Start Time</label>
                    <input
                        type="datetime-local"
                        id="start-time"
                        name="start-time"
                        className="border border-gray-300 rounded p-2"
                        disabled={isLoading || isError}
                        defaultValue={defaultStartTime}
                    />
                </div>
                <div className="flex flex-col space-y-2">
                    <label htmlFor="end-time" className="text-sm font-medium text-gray-700">End Time</label>
                    <input
                        type="datetime-local"
                        id="end-time"
                        name="end-time"
                        className="border border-gray-300 rounded p-2"
                        disabled={isLoading || isError}
                        defaultValue={defaultEndTime}
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600 transition-colors"
                    disabled={isLoading || isError}
                    onClick={() => {
                        const startTime = (document.getElementById('start-time') as HTMLInputElement).value;
                        const endTime = (document.getElementById('end-time') as HTMLInputElement).value;
                        if (startTime && endTime) {
                            const range = `${new Date(startTime).toISOString()}...${new Date(endTime).toISOString()}`;
                            window.location.href = `/student/${subjectId}/range/${range}`;
                        }
                    }}
                >
                    View Events
                </button>
            </div>
        </div>
    );
}