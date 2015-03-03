define(function(require,exports,module){

    var BoxView = require('PositioningLayouts/BoxView');
    var SequenceView = require('PositioningLayouts/PSequenceView');

    function ListSelector(options)
    {
        BoxView.call(this,options);

        this.popView = _makePopupView.call(this);
    }

    ListSelector.prototype = Object.create(BoxView.prototype);
    ListSelector.prototype.constructor = ListSelector;

    function _makePopupView()
    {
        var popupView = new SequenceView({
            direction:1
        });


        return popupView;

    }

    ListSelector.prototype.setItems = function()
    {

    };



});