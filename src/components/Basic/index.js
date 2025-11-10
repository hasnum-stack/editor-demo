import React, { useState } from "react";
import { DndContext } from "@dnd-kit/core";

import { Droppable } from "./Droppable";
import { Draggable } from "./Draggable";
import { SortableItem } from "./SortableItem";
import { SortableContext } from "@dnd-kit/sortable";

import { nanoid } from "nanoid";

function Basic() {
  // const [isDropped, setIsDropped] = useState(false);
  const draggableMarkup = <Draggable id="x">Drag me</Draggable>;

  const [list, setList] = useState([]);
  console.log(list, "123213");
  return (
    <DndContext onDragEnd={handleDragEnd} onDragMove={handleOverEnd}>
      {draggableMarkup}
      {/* {!isDropped ? draggableMarkup : null} */}
      {/* {!isDropped ?  : null} */}
      {/* <Droppable>{isDropped ? draggableMarkup : 'Drop here'}</Droppable> */}
      {/* <Droppable>{isDropped ? list.map((item, index) => <div key={index}>{item}</div>) : 'Drop here'}</Droppable> */}
      {/*<Droppable>*/}
      {/*  {list.map((item, index) => {*/}
      {/*    const { id, content } = item;*/}
      {/*    return (*/}
      {/*      <Draggable id={id} key={id}>*/}
      {/*        <div key={index} id={`${id}`}>*/}
      {/*          {content}*/}
      {/*        </div>*/}
      {/*      </Draggable>*/}
      {/*    );*/}
      {/*  })}*/}
      {/*</Droppable>*/}
      <Droppable>
        <SortableContext items={list}>
          {list.map((item, index) => {
            const { id, content } = item;
            return (
              <SortableItem id={id} key={id}>
                <div key={index} id={`${id}`}>
                  {content}
                </div>
              </SortableItem>
            );
          })}
          {/* ... */}
          {/*</div>*/}
        </SortableContext>
      </Droppable>
    </DndContext>
  );

  function handleDragEnd(event) {
    console.log(event, "eventevent");
    if (event.over && event.over.id === "droppable") {
      // setIsDropped(true);
      setList((prevList) => {
        const id = nanoid(4);
        return [
          ...prevList,
          {
            id,
            content: id,
          },
        ];
      });
    }
  }
  function handleOverEnd(event) {
    // console.log(event, "handleOverEnd");
  }
}
export default Basic;
