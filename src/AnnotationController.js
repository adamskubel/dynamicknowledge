define(function (require, exports, module)
{
    var DynamicContainer = require('PositioningLayouts/DynamicContainer');
    var BoxView = require('PositioningLayouts/BoxView');
    var Utils = require('Utils');

    var MouseSync = require('famous/inputs/MouseSync');
    var Vector = require('ProperVector');
    var LineCanvas = require('./LineCanvas');

    var Label = require('Model/Label');
    var LabelState = require('Model/LabelState');

    var EventEmitter = require("famous/core/EventEmitter");


    var annoColor = 6000;
    var editColor = 12000;

    function AnnotationController(annotateObject,mainLayout,gapiModel){

        this.gapiModel = gapiModel;
        this.state = 'Off';

        this._eventOutput = new EventEmitter();

        var rootMap = gapiModel.getRoot().get("annotationMap");

        var labelList;
        if (rootMap.has(annotateObject._globalId))
        {
            labelList = rootMap.get(annotateObject._globalId);
        }
        else
        {
            labelList = gapiModel.createList();
            rootMap.set(annotateObject._globalId,labelList);
            console.log("Creating list for key " + annotateObject._globalId);
        }
        this.labelList = labelList;

        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, function(event){
            _loadModel.call(this,event.values);
        }.bind(this));

        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, function(event){
            console.log("Removing: ");

            for (var i=0;i<event.values.length;i++)
            {
                console.log(event.values[i]);
                this.annotationContainer.removeChild(this.annotationMap[event.values[i].id].labelView);
            }
        }.bind(this));

        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, function(event){
            console.log("Set values: " + event.values);
        });

        this.annotationMap = {};

        _makeObjectAnnotated.call(this,annotateObject,mainLayout);
        _initEditUI.call(this,this.annotationContainer);
        _loadModel.call(this,labelList.asArray());

        this.setEditMode("Off");
    }

    function _loadModel(labels)
    {
        console.log("Loading " + labels.length + " labels");
        for (var i=0;i<labels.length;i++)
        {
            _addLabelBox.call(this,this.annotationContainer,labels[i]);
        }
    }

    AnnotationController.prototype.setEditMode = function(mode)
    {
        if (this._editMode != mode)
        {
            this._editMode = mode;

            if (mode == "CanEdit")
            {
                _saveAnnotations.call(this);
                //this._editAnnotationButton.show();
                this.saveButton.hide();
                this.addLabelButton.hide();
                this.lineButton.hide();
            }
            else if (mode == "IsEditing")
            {
                this._editAnnotationButton.show();
                this.saveButton.show();
                this.addLabelButton.show();
                this.lineButton.show();
            }
            else
            {
                _saveAnnotations.call(this);
                this._editAnnotationButton.show();
                this.saveButton.hide();
                this.addLabelButton.hide();
                this.lineButton.hide();
            }
        }

        this._eventOutput.emit('editmode');
    };

    AnnotationController.prototype.setState = function(state){
        if (this.state != state)
        {
            this._editAnnotationButton.setText(state);
            this.state = state;

            var labels = this.labelList.asArray();
            for (var i=0;i<labels.length;i++)
            {
                var lbl = labels[i];
                if (!lbl)
                {
                    console.error("Null value in array at i=" +i);
                    continue;
                }

                if (lbl.stateMap.has(state))
                    this.annotationMap[lbl.id].labelView.setPosition(lbl.stateMap.get(state).position);
            }
        }
    };

    AnnotationController.prototype.close = function()
    {
        _saveAnnotations.call(this);
        this.setEditMode("CanEdit");
    };

    function _initEditUI(dc)
    {
        if (!this.addLabelButton)
        {
            var addLabelButton = new BoxView({
                text: "+", size: [40, 40], clickable: true, color: annoColor,
                position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
            });

            dc.add(addLabelButton.getModifier()).add(addLabelButton.getRenderController());

            addLabelButton.on('click', function ()
            {
                var model = Label.create(this.gapiModel,this.labelList.length);

                model.size = [160, 80];
                model.text = "Label!";
                var newState = LabelState.create(this.gapiModel,this.state);
                model.addState(this.state,newState);
                newState.position = [0,-10,0];

                this.labelList.push(model);
            }.bind(this));

            var saveButton = new BoxView({
                text: "[]", size: [40, 40], clickable: true, color: annoColor,
                position: [40, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
            });

            dc.add(saveButton.getModifier()).add(saveButton.getRenderController());

            saveButton.on('click', function ()
            {
                this.close();
            }.bind(this));

            var lineButton = new BoxView({
                text: "|", size: [40, 40], clickable: true, color: annoColor,
                position: [80, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
            });


            dc.add(lineButton.getModifier()).add(lineButton.getRenderController());

            lineButton.on('click', function ()
            {
                _startLineDraw.call(this, dc);
            });

            var annotateObjectButton = new BoxView({
                text: "...",
                size: [100, 30],
                //clickable: true,
                color: annoColor,
                position: [0, 0, 15]
            });

            dc.add(annotateObjectButton.getModifier()).add(annotateObjectButton.getRenderController());

            //annotateObjectButton.on('click',function(){
            //    this.setEditMode("IsEditing");
            //}.bind(this));

            this._editAnnotationButton = annotateObjectButton;
            this.saveButton = saveButton;
            this.addLabelButton = addLabelButton;
            this.lineButton = lineButton;
        }
    }


    function _makeObjectAnnotated(object,mainLayout)
    {
        var dc = new DynamicContainer({
            edgePadding: [10, 10],
            isAnimated: false
        });

        var containerBackground = new BoxView({
            color: annoColor,
            style: 'borderOnly'
        });

        dc.setAnimated(false);
        dc.add(containerBackground.getModifier()).add(containerBackground);

        dc.background = containerBackground;

        object.setPosition([0, object.position[1], 0]);
        dc.addChild(object);

        var index = mainLayout.children.indexOf(object);

        mainLayout.removeChild(object);
        mainLayout.addChild(dc, {
            weight: 2,
            index: index,
            align:'center'
        });

        this.annotationContainer = dc;
    }

    function _saveAnnotations()
    {
        for (var key in this.annotationMap)
        {

            var ac = this.annotationMap[key];
            console.log("Saving labels for state '" + this.state + "'. Text = " + ac.labelView.getText());
            
            ac.labelView.setEditable(false);
            ac.moveButton.hide();
            ac.sizeButton.hide();

            ac.model.text = ac.labelView.getText();
            ac.model.size = ac.labelView.size;

            if (!ac.model.stateMap.has(this.state))
                ac.model.addState(this.state,LabelState.create(this.gapiModel));

            ac.model.getState(this.state).position = ac.labelView.position;

        }
    }

    function _makeDeleteButton(ac)
    {
        var deleteButton = new BoxView({
            text: "X", size: [30, 30], clickable: true, color: 900,
            position: [0, 0, 5], viewAlign: [0, 1], viewOrigin: [0.8, 0.2], fontSize: 'large'
        });
        ac.labelView.add(deleteButton.getModifier()).add(deleteButton.getRenderController());

        deleteButton.on('click',function(){
            this.labelList.removeValue(ac.model);
        }.bind(this));

        return deleteButton;
    }

    function _addLabelBox(dc, model)
    {
        var labelState = model.getState(this.state);
        if (!labelState)
        {
            console.warn("Active state '" + this.state + "' not found in label");
            labelState = LabelState.create(this.gapiModel);
            labelState.position = [0,0,0];
        }

        var newLabel = new BoxView({
            text: model.text,
            position: labelState.position,
            viewOrigin: [0, 0],
            size: model.size,
            color: annoColor,
            editable: true,
            renderWhitespace:true
        });

        newLabel.setAnimated(false);

        var annotationControl = function(){};

        annotationControl.model = model;
        annotationControl.moveButton = _makeBoxMovable(dc, newLabel);
        annotationControl.sizeButton = _makeBoxResizable(newLabel);
        annotationControl.labelView = newLabel;
        annotationControl.deleteButton = _makeDeleteButton.call(this,annotationControl);

        this.annotationMap[model.id] = annotationControl;

        var updateButtons = function()
        {
            if (this._editMode == "IsEditing")
            {
                annotationControl.deleteButton.show();
                annotationControl.moveButton.show();
                annotationControl.sizeButton.show();
            }
            else
            {
                annotationControl.deleteButton.hide();
                annotationControl.moveButton.hide();
                annotationControl.sizeButton.hide();
            }
        };

        this._eventOutput.on('editmode',updateButtons.bind(this));

        dc.addChild(newLabel);
    }

    function _startLineDraw(dc)
    {
        for (var i = 0; i < dc._children.length; i++)
        {
            if (dc._children[i] instanceof BoxView)
                _makeLineAnchors.call(this, dc._children[i], dc);
        }
    }

    function _addReceivingAnchors(anchor, receiver, dc)
    {

        var alignList = [
            [0.5, 0],
            [1, 0.5],
            [0.5, 1],
            [0, 0.5]
        ];

        //for (var i=0;i<alignList.length;i++){

        var lineAnchor = new BoxView({
            size: [20, 20],
            clickable: true,
            color: 1700,
            viewAlign: alignList[0],
            viewOrigin: [0.5, 0.5],
            position: [0, 0, 5]
        });

        Utils.attachRenderController(lineAnchor);

        receiver.add(lineAnchor.getModifier()).add(lineAnchor.renderController);
        lineAnchor.show();


        lineAnchor.parent = receiver;

        lineAnchor.textSurface.on('mousemove', function ()
        {
            //console.log('hi!');
            anchor.activeReceiver = lineAnchor;
        });

        lineAnchor.backSurface.on('mouseleave', function ()
        {
            anchor.activeReceiver = undefined;
        });

        anchor.on('draw_end', function (activeReceiver)
        {

            if (lineAnchor != activeReceiver)
                lineAnchor.hide();
        });

    }

    function _addReceivingAnchorsAll(anchor, dc)
    {

        for (var i = 0; i < dc._children.length; i++)
        {
            var child = dc._children[i];
            if (child != anchor.parent)
                _addReceivingAnchors.call(this, anchor, child, dc);
        }
    }

    function _addLineDrawingToAnchor(anchor, dc)
    {

        var lineSync = new MouseSync({
            propogate: true
        });

        anchor.activeLine = new LineCanvas();
        anchor.activeLine.parent = dc;

        lineSync.on('start', function (data)
        {
            _addReceivingAnchorsAll.call(this, anchor, dc);
            anchor.activeLineEnd = Vector.fromArray(anchor.calculatePosition(dc));
        }.bind(this));

        lineSync.on('update', function (data)
        {
            anchor.activeLineEnd = Vector.fromArray(data.delta).add(anchor.activeLineEnd);
            anchor.activeLine.setLinePoints(anchor.calculatePosition(dc), anchor.activeLineEnd.toArray());
        });

        lineSync.on('end', function (data)
        {
            if (anchor.activeReceiver)
            {
                console.log("Binding to " + anchor.activeReceiver._globalId);
                anchor.parent.on('positionChange', function ()
                {
                    anchor._eventOutput.emit('positionChange');
                });
                anchor.activeLine.setLineObjects(anchor, anchor.activeReceiver);
            }
            anchor._eventOutput.emit('draw_end', anchor.activeReceiver);
        });

        dc.add(anchor.activeLine.getModifier()).add(anchor.activeLine);

        anchor.backSurface.pipe(lineSync);
        anchor.textSurface.pipe(lineSync);
        anchor._drawMouseSync = lineSync;
    }

    function _makeLineAnchors(box, dc)
    {
        var alignList = [
            [0.5, 0],
            [1, 0.5],
            [0.5, 1],
            [0, 0.5]
        ];

        for (var i = 0; i < alignList.length; i++)
        {

            var lineAnchor = new BoxView({
                size: [20, 20],
                clickable: true,
                color: 18000,
                viewAlign: alignList[i],
                viewOrigin: [0.5, 0.5],
                position: [0, 0, 5]
            });

            box.add(lineAnchor.getModifier()).add(lineAnchor);
            _addLineDrawingToAnchor.call(this, lineAnchor, dc);

            lineAnchor.parent = box;
        }
    }

    function _makeBoxMovable(dc, box)
    {

        var moveButton = new BoxView({
            text: "", size: [30, 30], clickable: true, color: editColor,
            position: [0, 0, 10], viewAlign: [0, 0], viewOrigin: [0.8, 0.8], fontSize: 'large'
        });

        Utils.attachRenderController(moveButton);
        box.add(moveButton.getModifier()).add(moveButton.renderController);
        moveButton.show();

        var dragController = new MouseSync();
        dragController.on('update', function (data)
        {
            var offset = Vector.fromArray(data.delta);
            var newPos = Vector.fromArray(box.position).add(offset);

            box.setPosition(newPos.toArray());
            box.requestLayout();
        });
        moveButton.backSurface.pipe(dragController);


        return moveButton;
    }

    function _makeBoxResizable(box)
    {

        var resizeButton = new BoxView({
            text: "", size: [30, 30], clickable: true, color: editColor,
            position: [0, 0, 5], viewAlign: [1, 1], viewOrigin: [0.2, 0.2], fontSize: 'large'
        });
        Utils.attachRenderController(resizeButton);

        box.add(resizeButton.getModifier()).add(resizeButton.renderController);
        resizeButton.show();

        var dragController = new MouseSync();

        dragController.on('update', function (data)
        {
            var offset = Vector.fromArray(data.delta);
            var newSize = Vector.fromArray(box.size).add(offset);

            box.setSize(newSize.toArray());
            box.requestLayout();
        });
        resizeButton.backSurface.pipe(dragController);
        return resizeButton;
    }

    module.exports = AnnotationController;

});