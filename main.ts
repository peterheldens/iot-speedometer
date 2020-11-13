// let wheel_diameter_inches = 9.25
// tested but did not work
// yaw = 180 * atan (accelerationZ/sqrt(accelerationX*accelerationX + accelerationZ*accelerationZ))/M_PI;
// https://engineering.stackexchange.com/questions/3348/calculating-pitch-yaw-and-roll-from-mag-acc-and-gyro-data
// https://os.mbed.com/questions/83017/Calculating-Yaw-using-accelerometer-and-/
// this.yaw = 180 * Math.atan(this.acc_z/Math.sqrt(this.acc_x*this.acc_x + this.acc_z*this.acc_z))/ Math.PI
// this.rad1=Math.PI * this.yaw / 45
// ADD Digits
// ADD fintune swith auto hor vert with base positions
// ADD base position measurement also for horizontal and auto

enum Position {
    //%block="vertical"
    Vertical,
    //%block="horizontal"
    Horizontal,
    //%block="auto"
    Auto
}

enum RotationDirection {
    //%block="clockwise"
    Clockwise,
    //%block="counterclockwise"
    Counterclockwise
}

enum Runstate {
    //% block="start"
    Start,
    //% block="stop"
    Stop,
    //% block="pause"
    Pause,
    //% block="resume"
    Resume
}

enum DiameterOrRadius {
    //%block="diameter"
    Diameter,
    //%block="radius"
    Radius,
    //%block="circumfence"
    Circumfence
}

enum Units {
    //% block="inches"
    Inches,
    //% block="centimeters"
    Centimeters
}

enum ValueType {
    //% block="current"
    Cur,
    //% block="minumum"
    Min,
    //%block="maximum"
    Max,
    //%block="average"
    Avr
}

enum DistanceUnit {
    // https://www.differencebetween.com/difference-between-mile-and-vs-kilometer-km/
    // One mile equals 1760 yards and 
    // one yard contains 3 feet making it equal to 1.609344 kilometers. 
    // One kilometer equals 1000 meters and 0.621371 miles.
    //
    //% block="kilometer"
    Kilometer,
    //% block="meter"
    Meter,
    //% block="centimeter"
    Centimeter,
    //% block="millimeter"
    Millimeter,
    //% block="mile"
    Mile,
    //% block="yard"
    Yard,
    //% block="feet"
    Feet
}

enum SpeedType {
    //% block="kilometers per hour (Kph)"
    Kph,
    //% block="miles per hour (Mph)"
    Mph
}

enum Stream {
    //% block="Device Console"
    MakeCode,
    //% block="Excel Data Streamer"
    DataStreamer
}

/**
 * Functions to operate Speedometer meters.
 */
//% weight=5 color=#2699BF icon="\uf0e4" block="Speedometer"
//% groups='["Setup","Distance","Rotation","Speed","Data","Info","Advanced"]'
namespace speedometer {
    export class Meter {

    // user defined @creation
    private radius : number     //radius in centimeters of micro:bit attached circle
    private _position: Position //position defines rotation are measured vertical or horizontal
    private segments : number   //number of defined circle segments
    private _direction : RotationDirection //rotation direction: clockwise or anti-clockwise

    // user input @runtime
    private runstate : Runstate // runstate defines operation mode: start, stop, pause, resume
    private radioOn : boolean   // switch Radio output on/off
    private serialOn : boolean  // switch Serial output on/off
    private dataStream : Stream // dataSteam format: MakeCode or Excel DataStreamer
    private avrWindow: number   // window in milliseconds to calculate averages
    private amplitude: number   // amplitude threshold (-2PI< a <2PI) to determine new rotation

    // user output @runtime
    private kph : number        // kilometer per hour
    private kph_min : number    // minimum kilometer per hour
    private kph_max : number    // maximum kilometer per hour
    private kph_avr : number    // average kilometer per hour
    private kph_cnt : number    // count of all kph measurements
    private _rotations : number  // number of 360 degree rotations (complete cycle)
    private rpm : number        // rotations per minute
    private rpm_min : number    // minimum rotations per minute
    private rpm_max : number    // maximum rotations per minute
    private rpm_avr : number    // average rotations per minutenumber of 360 degree turnarounds (complete cycle)
    private rpm_cnt : number    // count of all rpm measurements  

    // system defined @runtime
    private acc_x : number      //accelerometer X: for debugging purposes
    private acc_y : number      //accelerometer Y: for debugging purposes
    private acc_z : number      //accelerometer Z: for debugging purposes
    private yaw: number         // yaw to experiment with horizontal rotations
    private speed : number 
    private distance : number
    private t0 : number         // time at t0 in milliseconds
    private t1 : number         // time at t1 in milliseconds
    private t2 : number         // time at t2 in milliseconds for debugging
    private d0 : number         // distance at time t0 in centimeters
    private d1 : number         // distance at time t1 in centimeters
    private r0 : number         // rotations at time t0
    private r1 : number         // rotations at time t1
    private rad0 : number       // radius at t0
    private rad1 : number       // radius at t1
    private base_pos : number   // base position
    private s0: number          // segment at time t0
    private s1: number          // segment at time t1

    constructor() {
        // user defined @creation
        this.radius = 0 
        this._position = Position.Vertical
        this.segments = 1
        this._direction = RotationDirection.Counterclockwise
        // user input @ runtime
        this.runstate = Runstate.Stop
        this.radioOn = true
        this.serialOn = false
        this.dataStream = Stream.MakeCode
        this.avrWindow = 1500
        this.amplitude = 5
        // user output @runtime
        this.kph = 0
        this.kph_min = 1000
        this.kph_max = -1000
        this.kph_avr = 0
        this.kph_cnt = 0
        this._rotations = 0
        this.rpm = 0
        this.rpm_min = 1000
        this.rpm_max = -1000
        this.rpm_avr = 0
        this.rpm_cnt = 0
        // system defined @runtime
        this.acc_x = 0
        this.acc_y = 0
        this.acc_z = 0
        this.yaw = 0
        this.speed = 0
        this.distance = 0
        this.t0 = 0
        this.t1 = 0
        this.t2 = 0
        this.d0 = 0
        this.d1 = 0
        this.r0 = 0
        this.r1 = 0
        this.rad0 = 0
        this.rad1 = 0
        this.base_pos = 0
        this.s0 = 0
        this.s1 = 0
    }

    resetKph () {
        this.kph = 0
        this.kph_min = 1000
        this.kph_max = -1000
        this.kph_avr = 0
        this.kph_cnt = 0
    }

    resetRpm () {
        this.rpm = 0
        this.rpm_min = 1000
        this.rpm_max = -1000
        this.rpm_avr = 0
        this.rpm_cnt = 0
    }

    setRadius(x: number) {
        this.radius = x
    }

 
    /**
     * Meter is Running ?
     */
    //% blockId="speedometer_isRunning"
    //% block="%meter|is running" blockGap=8
    //% s.defl=4 s.min=0 s.max=144
    //% weight=81
    //% parts="speedometer"
    //% group="Info" advanced=true
    isRunning () : boolean {
        return (this.runstate==Runstate.Start || this.runstate==Runstate.Resume)
    }

    /**
     * Set dataStream.
     */
    //% blockId="speedometer_setdataStream"
    //% block="%meter|set datastream format to %d" blockGap=8
    //% s.defl=dataStream.MakeCode
    //% weight=81
    //% parts="speedometer"
    //% group="Data" advanced=true
    setdataStream (d: Stream) {
        this.dataStream=d
    }

    /**
     * Set avrWindow.
     */
    //% blockId="speedometer_setAvrWindow"
    //% block="%meter|set average calculation window to %x milliseconds" blockGap=8
    //% x.defl=1500
    //% weight=81
    //% parts="speedometer"
    //% group="Advanced" advanced=true
    setAvrWindow (x: number) {
        this.avrWindow=x
    }

    /**
     * Set setClockWise.
     */
    //% blockId="speedometer_setRotationDirection"
    //% block="%meter|set wheel direction to clockwise = %c" blockGap=8
    //% c.defl=false
    //% weight=81
    //% parts="speedometer"
    //% group="Advanced" advanced=true
    setRotationDirection (c: RotationDirection) {
        this._direction=c
    }

    /**
     * Set amplitude theshold.
     */
    //% blockId="speedometer_setAmplitude"
    //% block="%meter|set rotation amplitude threshold to %x radians" blockGap=8
    //% x.defl=5
    //% x.min=0 x.max=2*Math.PI
    //% weight=81
    //% parts="speedometer"
    //% group="Advanced" advanced=true
    setAmplitude (x: number) {
        this.amplitude=x
    }

    /**
     * Set position
     */
    //% blockId="speedometer_setPostition" 
    //% block="%meter| set wheel position to %p" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Info" advanced=true
    setPosition (p: Position) {
        this._position=p
    }

    /**
     * Get position
     */
    //% blockId="speedometer_getPostition" 
    //% block="%meter| position" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Info" advanced=true
    get position () : number { 
          return this._position
    }

    calcDistance (radians: number) : number {
        // distance = rotations * circumfence + arc lenght
        return this.rotations * this.circumfence(this.radius) + this.arc(radians, this.radius) - this.base_pos
    }

    /**
     * Get runState.
     */
    //% blockId="speedometer_runState" 
    //% block="%meter | runstate" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Info" advanced=true
    get runState () : Runstate {
        return this.runstate
        }

    /**
     * Get distance.
     */
    //% blockId="speedometer_getDistance" 
    //% block="%meter| distance in %distance" blockGap=8
    //% distance.defl=Distance.Meter
    //% weight=79
    //% parts="speedometer"
    //% group="Distance"
    getDistance (distance: DistanceUnit) : number {
        this.d1=100*1000
        switch (distance) {
            case DistanceUnit.Millimeter: 
                return this.d1 * 10
                break
            case DistanceUnit.Centimeter: 
                return this.d1
                break
            case DistanceUnit.Meter: 
                return this.d1 / 100
                break
            case DistanceUnit.Kilometer: 
                return this.d1 / 100000
                break
            case DistanceUnit.Feet: 
                return this.d1 * 0.03281
                break
            case DistanceUnit.Yard: 
                return this.d1 * 0.01094 
                break
            case DistanceUnit.Mile: 
                return this.d1 * 0.0000062137119223733
                break
            default: return 0 ;
        }
    }

    /**
     * Get segment.
     */
    //% blockId="speedometer_segment" 
    //% block="%meter| segment postition" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Distance", advanced=true
    get segment () : number {
          return this.s1
    }

    /**
     * Get diameter or radius or circumfence.
     */
    //% blockId="speedometer_getDiameter" 
    //% block="%meter|radius, diameter or circumfence = %type" blockGap=8
    //% type.defl=DiameterOrRadius.Circumfence
    //% weight=79
    //% parts="speedometer"
    //% group="Info" advanced=true
    getDiameter (type:DiameterOrRadius) : number {
    switch (type) {
        case DiameterOrRadius.Diameter: 
            return 2 * this.radius
            break
        case DiameterOrRadius.Radius:  
            return this.radius
            break
        case DiameterOrRadius.Circumfence: 
            return 2 * this.radius * Math.PI
            break
        }     
    }
    
    /**
     * Get Speedometer Time running from Start expressed in Milliseconds
     */
    //% blockId="speedometer_time" 
    //% block="%meter| running time" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Info" advanced=true
    get time () : number {
          return this.t1 - this.t0
    }



   
    /**
     * Get rotation from start.
     */
    //% blockId="speedometer_rotations" 
    //% block="%meter|%type|rotations from start" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Rotations"
    get rotations () : number {
            return this._rotations
    }

    /**
     * Get rotation in RPM.
     */
    //% blockId="speedometer_getRpm" 
    //% block="%meter|%type | rotations per minute (Rpm)" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Rotations"
    getRpm (type: ValueType) : number {
         switch (type) {
            case ValueType.Cur: 
                return this.rpm
                break
            case ValueType.Min: 
                return this.rpm_min
                break
            case ValueType.Max: 
                return this.rpm_max
                break
            case ValueType.Avr: 
                return this.rpm_avr
                break
        }
    }

    /**
     * Get speed.
     */
    //% blockId="speedometer_kph" 
    //% block="%meter| %vt | speed in %st" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Speed"
    getKph (vt: ValueType, st: SpeedType) : number {
        let s=0
        switch (vt) {
            case ValueType.Cur: 
                s=this.kph
                break
            case ValueType.Min: 
                s=this.kph_min
                break
            case ValueType.Max: 
                s=this.kph_max
                break
            case ValueType.Avr: 
                s=this.kph_avr
                break
        }
        switch (st) {
            case SpeedType.Kph: 
                return s
                break
            case SpeedType.Mph: 
                return convertKph2Mph(s)
                break
        }
    }

    circumfence (radius: number) : number {
        // returns circumfence of circle, reference: https://en.wikipedia.org/wiki/Circumference
        return 2 * Math.PI * radius
    }

    digits (value: number, nr: number) : number {
        //TODO / fix
        return Math.round(nr * value) / nr
    }


    /**
     * Initialise Meter.
     */
    //% blockId="speedometer_init" 
    //% block="%meter|%type" blockGap=8
    //% type.defl=Runstate.start
    //% weight=100
    //% parts="speedometer"
    //% group="Setup"
      init (type: Runstate) {
        switch (type) {
            case Runstate.Start: {
                // calibrate values to start point
                this.runstate=Runstate.Start
                //
                // set base position
                this.rad1 = Math.atan2(input.acceleration(Dimension.Y), input.acceleration(Dimension.X))
                this.rad0 = this.rad1
                this.base_pos = this.arc(this.rad1, this.radius)
                // reset timer
                this.t1 = input.runningTime()
                this.t0 = this.t1
                // reset distance
                this.d0 = 0
                this._rotations = 0
                this.resetKph()
                this.resetRpm()
                break
            } 
            case Runstate.Stop: {
                this.runstate=Runstate.Stop
                break
            }
            case Runstate.Pause: {
                this.runstate=Runstate.Pause
                break
            }
            case Runstate.Resume: {
                this.runstate=Runstate.Resume
                break
            }
        }
    }

    /**
     * Output to Serial
     */
    //% blockId="speedometer_outputSerial" 
    //% block="%meter|send data insights to serial $on" blockGap=8
    //% on.shadow="toggleOnOff"
    //% on.defl=true
    //% weight=100
    //% parts="speedometer"
    //% group="Data" advanced = true
    outputSerial (on:boolean) {
          this.serialOn = on
    }

        /**
     * Output to Radio
     */
    //% blockId="speedometer_outputRadio" 
    //% block="%meter|send data insights to radio $on" blockGap=8
    //% on.shadow="toggleOnOff"
    //% on.defl=false
    //% weight=100
    //% parts="speedometer"
    //% group="Data" advanced = true
      outputRadio (on:boolean) {
          this.radioOn = on
      }
   
    /**
     * Update Meter.
     */
    //% blockId="speedometer_update" 
    //% block="%meter|updating" blockGap=8
    //% meter.defl=meter
    //% weight=79
    //% parts="speedometer"
    //% group="Setup"
    public update () {
        if (this.isRunning()) {
            this.updateRadius()
            this.updateSegment()
            this.updateRotations()
            this.updateDistance()
            this.updateSpeed() //frequency of 1 on avrWindow milliseconds
            //this.updateGraph()
        }
    }

    updateRadius () {
        this.rad0 = this.rad1
        this.acc_x= input.acceleration(Dimension.X)
        this.acc_y= input.acceleration(Dimension.Y)
        this.acc_z= input.acceleration(Dimension.Z)
        switch(this.position) {
            case Position.Horizontal:
                this.rad1 = this.getRadiusHorizontal()
                break
            case Position.Vertical:
                this.rad1 = this.getRadiusVertical()
                break
            case Position.Auto:
                if(input.isGesture(Gesture.ScreenUp) || (input.isGesture(Gesture.ScreenDown))) {
                    this.rad1 = this.getRadiusHorizontal()
                }
                else {
                    this.rad1 = this.getRadiusVertical()
                }
            break
        }
        this.t1 = input.runningTime()
    }

    getRadiusVertical (): number {
        const r = -1 * Math.atan2(input.acceleration(Dimension.Y), input.acceleration(Dimension.X))
        return this.clockwise(r)
    }

    getRadiusHorizontal () : number {
        const r = input.compassHeading() * Math.PI/180 -Math.PI
        return this.clockwise(r)
    }

    clockwise (r: number) : number {
        switch(this._direction) {
            case RotationDirection.Clockwise:
                return r
                break
            case RotationDirection.Counterclockwise:
                return -r
                break
        } 
    }


    updateSegment () {
        this.s0 = this.s1
        const p = 2* Math.PI/this.segments
        this.s1 = this.rad1 / p
    }

    updateRotations () {
        // dit was < -1.5 en > 1.5
        if (this.rad1 - this.rad0 < -1 * this.amplitude) {
            this._rotations += 1
        } else if (this.rad1 - this.rad0 > +1 * this.amplitude) {
            this._rotations += -1
        }
        this.r1=this.rotations
    }

    updateDistance () {
        // all distances are expressed in centimeters
        this.d1 = this.calcDistance(this.rad1)
    }

    updateSpeed () {
        if (this.t1 - this.t0 > this.avrWindow) {
            const elapsedSeconds = ((this.t1 - this.t0) / 1000) // elapsed seconds
            const cps = (this.d1 - this.d0) / elapsedSeconds    // centimeters per second
            const mps = cps / 100                               // meters per second
            const mph = mps * 3600                              // meters per hour
            const kph = mph / 1000                              // kilometer per hour
            this.kph_avr=cumulativeMovingAverage(kph, this.kph_avr, this.kph_cnt+=1)
            this.kph_min=Math.min(kph,this.kph_min)
            this.kph_max=Math.max(kph,this.kph_max)
            this.kph = kph

            // update RPM
            const rps=mps / this.circumfence(this.radius)        // rotations per second
            const rpm=rps*60                                     // rotations per minute
            this.rpm_avr=cumulativeMovingAverage(rpm, this.rpm_avr, this.rpm_cnt+=1)
            this.rpm_min=Math.min(rpm,this.rpm_min)
            this.rpm_max=Math.max(rpm,this.rpm_max)
            this.rpm=rpm

            // update timer
            this.t0 = this.t1
            // update sliding distance window
            this.d0 = this.d1
            // update sliding rotation window
            this.r0 = this.r1
        }
    }

/*
    updateGraph () {
        if ((this.radioOn || this.serialOn) && (this.isRunning())) {
          //  this.sendData("t0",this.t0)

         //    this.sendData("t1",this.t1) 
         //    this.sendData("t1",this.t1-this.t2) 
            this.sendData("t2",this.yaw)
        //    this.t2=this.t1
        //    this.sendData("acc_x", this.acc_x)
        //    this.sendData("acc_y", this.acc_y)
        //    this.sendData("acc_z", this.acc_z)
            this.sendData("radius", this.rad1)
            this.sendData("rotation", this.rotations) // sendData seems to be limited to 8 chars: s rotation and not rotations
        //    this.sendData("distance", this.d1)
        //    this.sendData("rpm", this.rpm)
        //  this.sendData("rpm_min", this.rpm_min)
        //  this.sendData("rpm_max", this.rpm_max)
        //  this.sendData("rpm_avr", this.rpm_avr)
        //  this.sendData("kph", this.kph)
        //  this.sendData("kph_min", this.kph_min)
        //  this.sendData("kph_max", this.kph_max)
        //  this.sendData("kph_avr", this.kph_avr)
        //  if (this.dataStream == Stream.DataStreamer) {
        //      this.sendData("eol", 1) 
        //  }
        }
    }
    */
    
    /*
    sendData (text: string, num: number) {
        if(this.serialOn) {
            serial.writeValue(text, this.digits(num, 100))
        } 
        if (this.radioOn) {
            radio.sendValue(text, this.digits(num, 100))
        }
        basic.pause(5)
    }
    */

    arc (radians: number, radius: number) {
    // returns arc length, reference: https://en.wikipedia.org/wiki/Arc_(geometry)
    return radians * radius
    }
}

/**
 * Create a new Meter for `diameter` circumfence of circle
 * @param diameter the diameter of the circle, eg: 28 inch
 */
//% blockId="speedometer_create" 
//% block="wheel %type of %x %units||running %p|rotating %c|covering %s segments"
//% inlineInputMode=inline
//% x.defl=28
//% s.defl=1
//% units.defl=Units.Inches
//% weight=2000
//% parts="speedometer"
//% group="Setup"
//% trackArgs=0,2
//% blockSetVariable=meter
export function create(type: DiameterOrRadius, x: number, units: Units, p?:Position, c?: RotationDirection,s?:number): Meter {
    let meter = new Meter();
    meter.setRotationDirection(c)
    switch (p) {
        case Position.Vertical: 
            meter.setPosition(Position.Vertical)
            break
        case Position.Horizontal: 
            meter.setPosition(Position.Horizontal)
            break
    }
    let r = 0
    switch (type) {
        case DiameterOrRadius.Diameter: 
            r=x/2
            break
        case DiameterOrRadius.Radius:  
            r=x
            break
        case DiameterOrRadius.Circumfence: 
            r=x/(2*Math.PI)
            break
    }
    switch (units) {
        case Units.Centimeters: 
            meter.setRadius(r)
            break
        case Units.Inches: 
            meter.setRadius(convertInch2Centimeter(r))
            break
    }
     return meter
}

    /**
     * Show bikespeed.
     */
    //% blockId="speedometer_plotAt" 
    //% block="show speed %index" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Setup"
    export function plotAt (index: number) {
        basic.clearScreen()
        index |= 0
        for(let i = 0; i < index; i++) {
            const y = Math.floor(index / 5)
            const x = Math.floor(index % 5)
            led.plot(x, y)
        }
    }

}

// USED
    function convertInch2Meter (inch: number) : number {
        // converts inches to metric (1 inch = 25.4 mm, 2.54 cm, 0,0254m), reference: https://en.wikipedia.org/wiki/I
        return inch * 0.0254
    }

    function cumulativeMovingAverage(x: number, avr: number, cnt:number,) : number {
        // https://en.wikipedia.org/wiki/Moving_average
        return avr+((x-avr)/cnt)
    }

    function convertKph2Mph (k: number) : number {
        // converts Kph to Mph: 1 kph to mph = 0.62137 mph, reference: https://www.convertunits.com/from/kph/to/mph
        return k * 0.62137
    }

// NOT USED

    function convertInch2Centimeter (inch: number) : number {
        // converts inches to metric (1 inch = 25.4 mm, 2.54 cm, 0,0254m), reference: https://en.wikipedia.org/wiki/I
        return inch * 2.54
    }

    function convertMeter2Inch (meter: number) : number {
        // 1m in inches = 39.37007874 inches
        return meter * 39.37007874
    }
  
    function convertCentimeter2Inch (centimeter: number) : number {
        //  1cm in inches = 0.3937008in
        return centimeter * 0.3937008
    }