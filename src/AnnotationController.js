define(function (require, exports, module)
{
    var DynamicContainer = require('PositioningLayouts/DynamicContainer');
    var BoxView = require('PositioningLayouts/BoxView');
    var Utils = require('Utils');

    var MouseSync = require('famous/inputs/MouseSync');
    var Vector = require('ProperVector');
    var LineCanvas = require('./LineCanvas');

    var Label = require('Model/Label');


    var annoColor = 6000;
    var editColor = 12000;

    function AnnotationController(annotateObject,mainLayout,gapiModel){

        this.gapiModel = gapiModel;


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

        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, function(event){
            _loadModel.call(this,event.values);
        }.bind(this));

        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, function(event){
            console.log("Removed values: " + event.values);
        });

        labelList.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, function(event){
            console.log("Set values: " + event.values);
        });

        this.labelList = labelList;
        this.annotationControls = [];

        _makeObjectAnnotated.call(this,annotateObject,mainLayout);
        _loadModel.call(this,labelList.asArray());
    }

    function _loadModel(labels)
    {
        console.log("Loading " + labels.length + " labels");
        for (var i=0;i<labels.length;i++)
        {
            _addLabelBox.call(this,this.annotationContainer,labels[i]);
        }
    }

    AnnotationController.prototype.close = function()
    {
        _saveAnnotations.call(this);

        this.saveButton.hide();
        this.addLabelButton.hide();
        this.lineButton.hide();

        this.annotationButton.show();
    };

    function _initEditUI(dc)
    {
        var addLabelButton = new BoxView({
            text: "+", size: [40, 40], clickable: true, color: annoColor,
            position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
        });

        dc.add(addLabelButton.getModifier()).add(addLabelButton.getRenderController());

        addLabelButton.on('click', function ()
        {
            var model = Label.create(this.gapiModel);

            model.position = [0,-10,0];
            model.size = [100,200];
            model.text = "Label!";

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

        this.saveButton = saveButton;
        this.addLabelButton = addLabelButton;
        this.lineButton = lineButton;
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
        mainLayout.addChild(dc, {weight: 2, index: index});

        _initEditUI.call(this,dc);

        this.annotationContainer = dc;
    }

    function _saveAnnotations()
    {
        for (var i = 0; i < this.annotationControls.length; i++)
        {
            var ac = this.annotationControls[i];
            ac.labelView.setEditable(false);
            ac.moveButton.hide();
            ac.sizeButton.hide();

            ac.model.text = ac.labelView.getText();
            ac.model.position = ac.labelView.position;
            ac.model.size = ac.labelView.size;

            console.log("Saving label. Text = " + ac.labelView.getText());
        }
    }

    function _addLabelBox(dc, model)
    {
        var newLabel = new BoxView({
            text: model.text,
            position: model.position,
            viewOrigin: [0, 0],
            size: model.size,
            color: annoColor,
            editable: true,
            renderWhitespace:true
        });

        newLabel.setAnimated(false);

        var annotationControl = function(){};

        //newLabel.setText(model.text);
        //newLabel.setPosition(model.position);
        //newLabel.setSize(model.size);


        annotationControl.model = model;
        annotationControl.moveButton = _makeBoxMovable(dc, newLabel);
        annotationControl.sizeButton = _makeBoxResizable(newLabel);
        annotationControl.labelView = newLabel;

        this.annotationControls.push(annotationControl);

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