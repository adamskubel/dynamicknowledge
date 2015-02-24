define(function (require, exports, module)
{

    function Colors(){


    }


    //Colors.Tungsten = function(alpha){
    //    return 'rgba(255,197,143,'+ alpha + ')';
    //};

    Colors.HoloBlue = function(alpha){
        return 'rgba(0,221,255,'+alpha+')';
    };

    Colors.Transparent = function(){
        return 'rgba(0,0,0,0)';
    }

    Colors.CarbonArc = function(){
        255, 250, 244
    }

    Colors.Annotation = 6000;
    Colors.EditColor = 12000;
    Colors.Tungsten = 3800;


    Colors.fromTemperature = function(temp,alpha){

        temp /= 100;
        var red =0;
        var blue = 0;
        var green = 0;

        if (temp <= 66)
        {
            red = 255;
        }
        else
        {
            red = temp - 60;
            red = 329.698727446 * (Math.pow(red,-0.1332047592));
        }
        red = Math.max(0,red);
        red = Math.min(255,red);


        if (temp < 66)
        {
            green = temp;
            green =  (99.4708025861 * Math.log(green)) - 161.1195681661
        }
        else
        {
            green = temp -60;
            green = 288.1221695283 * Math.pow(green,-0.0755148492);
        }
        green = Math.max(0,green);
        green = Math.min(255,green);


        if (temp >= 66)
        {
            blue = 255
        }
        else
        {
            if (temp <= 19)
            {
                blue = 0;
            }
            else
            {
                blue = temp - 10;
                blue = (138.5177312231 * Math.log(blue)) - 305.0447927307;
            }
        }
        blue = Math.max(0,blue);
        blue = Math.min(255,blue);

        if (alpha)
            return [red,green,blue,alpha];
        else
            return [red,green,blue];
    };

    Colors.makeColor = function(rgbValues,alpha){
        return 'rgba(' + Math.round(rgbValues[0]) + ',' + Math.round(rgbValues[1]) + ',' + Math.round(rgbValues[2]) +',' + alpha + ')';
    }

    Colors.get = function(name,alpha)
    {
        if (name instanceof Array)
        {
            return Colors.makeColor(name,alpha);
        }
        else if (!isNaN(name))
        {
            return Colors.makeColor(Colors.fromTemperature(name),alpha);
        }


        var colorMap = {
            'Tungsten':[255,197,143],
            'HoloBlue':[0,221,255],
            'Black':[0,0,0],
            'CarbonArc':[255,250,244],
            //'AnnotationColor' : 6000,
            'EditColor' : 12000
        };

        if (colorMap[name] != undefined)
        {
            return Colors.get(colorMap[name],alpha);
        }
        else
        {
            console.error('Color ' + name + ' not found');
        }
    };

    module.exports = Colors;

});