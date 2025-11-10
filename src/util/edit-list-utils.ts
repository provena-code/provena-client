
import type { MainTableEvent } from '@/api';
import { EditList, EditListBuilder, EditRange } from 'provena';

type Event = MainTableEvent;

export type EditHistoryFrame = {
    edits: EditRange[];
    editedRange: { start: number; end: number } | null;
}

export function createEditList(events: Event[]): EditHistoryFrame[] {
    const builder = new EditListBuilder(new EditList());

    let first = true;
    const history: EditHistoryFrame[] = [];
    for (const event of events) {
        // parse event.ServerTimestamp as ISO string
        const time = new Date(event.ServerTimestamp!).getTime();
        const insertedText = event.InsertText || '';
        const deletedLength = (event.DeleteText || '').length;
        const rangeOffset = parseInt(event.SourceLocation!);

        const editedRange = {
            start: rangeOffset,
            end: rangeOffset + insertedText.length,
        };

        if (first && insertedText.length > 1) {
            builder.editList.setInitialText(insertedText, time);
        } else {
            builder.addEditEvent({
                time: time,
                documentUri: event.CodeStateSection || '',
                type: 'EditEvent',
                contentChanges: [{
                    text: insertedText,
                    rangeOffset: parseInt(event.SourceLocation!),
                    rangeLength: deletedLength,
                }]
            });
        }
        first = false;

        history.push({
            edits: builder.editList.copyEdits(),
            editedRange: editedRange
        });
    }

    return history;
}