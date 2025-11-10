
import type { MainTableEvent } from '@/api';
import { EditList, EditListBuilder } from 'provena';

type Event = MainTableEvent;

export function createEditList(events: Event[]) {
    const builder = new EditListBuilder(new EditList());

    let first = true;
    const history = [];
    for (const event of events) {
        // parse event.ServerTimestamp as ISO string
        const time = new Date(event.ServerTimestamp!).getTime();
        const insertedText = event.InsertText || '';
        const deletedLength = (event.DeleteText || '').length;
        if (first && insertedText.length > 1) {
            builder.editList.setInitialText(insertedText, time);
            history.push(builder.editList.getEdits(true));
            continue;
        }
        first = false;
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

        history.push(builder.editList.getEdits(true));
    }

    return history;
}