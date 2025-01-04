import {debug, Entity, Component, DeleteComponent, TransformComponent, Game}
from './engine/engine.js';
import {ParticleEmitterComponent, ParticleSystem, ParticleInteractorComponent , ParticleTypeComponent, ParticleBurstComponent}
from './engine/particles.js';
import { CollisionSystem, CollisionComponent }
from './engine/collision.js';
//import {PhysicsComponent, PhysicsSystem} from './engine/physics.js';
import {SoundEffectComponent, SoundEffectSystem }
from './engine/soundEffects.js';
import {SpriteComponent,RotatedSpriteComponent, ScaledSpriteComponent, TiledSpriteComponent,AnimatedSpriteComponent, SquareComponent,CircleComponent, RenderSystem, TextComponent, WordWrappedTextComponent, LineComponent, PolygonComponent, CameraComponent, CompositeSpriteComponent, MultiRenderComponent, EntityRenderComponent}
from './engine/graphics.js';
import {MusicComponent, MusicSystem, RequiredTagsComponent,BlacklistedTagsComponent}
from './engine/music.js';
import {generatePolygon,Vector,pointInPolygon}
from './engine/vector.js';
import {TimerSystem, TimerComponent} from "./engine/timer.js";
//import {SaveLoad, SaveComponent} from './engine/saveLoad.js';
//import {AOEComponent, AOESystem} from "./engine/aoe.js";
import {AnimationComponent, AnimationSystem}
from './engine/animation.js';
import {UISystem, UIComponent}
from './engine/ui.js';
//deccorators




export const game = new Game("test",document.getElementById("canvas"));

const musicSystem = new MusicSystem();
const ses = new SoundEffectSystem();
ses.registerSoundEffect("./sound/Click 06.mp3","pickup");
ses.registerSoundEffect("./sound/Click with echo.mp3","drop");
const eventList = [{key:"Digit1",id:"systems"},{key:"Backquote",id:"overlay"},{key:"Digit2",id:"component"},{key:"Digit3",id:"entities"},{key:"Digit4",id:"particles"},{key:"Digit5",id:"collisions"},{key:"KeyW",id:"up"},{key:"ArrowUp",id:"up"},{key:"KeyS",id:"down"},{key:"ArrowDown",id:"down"},{key:"KeyA",id:"left"},{key:"ArrowUp",id:"left"},{key:"KeyD",id:"right"},{key:"ArrowRight",id:"right"},{key:"Space",id:"select"},{key:"Enter",id:"enter"}]
const uii = new UISystem(eventList);

//game.addSystem(musicSystem,2);
game.addSystem(ses,2);
game.addSystem(uii,0);
game.addSystem(new ParticleSystem(),0);
game.addSystem(new AnimationSystem(),1);
game.addSystem(new RenderSystem(game),0);
game.addSystem(new CollisionSystem(), 1)
game.addSystem(new TimerSystem(),0)
const jukeBox = new Entity("audio");
//const music = new MusicComponent("./music/GameMusic.mp3",["happy", "phrase", "high", "F"]);
//jukeBox.addComponent(music);
jukeBox.addComponent(new CameraComponent("table",0,0,10,1550,750,.25));
jukeBox.addComponent(new TransformComponent());

game.addEntity(debug);

debug.addComponent(new UIComponent([
  {event:"systems",callback:function(caller,input){if(input.action=="up"){caller.system = !caller.system;}}},
  {event:"overlay",callback:function(caller,input){if(input.action=="up"){caller.overlay = !caller.overlay;}}},
  {event:"component",callback:function(caller,input){if(input.action=="up"){caller.component = !caller.component;}}},
  {event:"entities",callback:function(caller,input){if(input.action=="up"){caller.entities = !caller.entities;}}},
  {event:"particles",callback:function(caller,input){if(input.action=="up"){caller.particles = !caller.particles;}}},
  {event:"collisions",callback:function(caller,input){if(input.action=="up"){caller.collisions = !caller.collisions;}}}
]));

game.addEntity(jukeBox);


function dustUpdate(particle, dt) {
  // Update the particle's position based on its velocity and acceleration
 particle.position.x += particle.velocity.x * dt/10;
  particle.position.y -= Math.abs(particle.velocity.y) * dt/2;
  particle.radius += 0.03*dt;
  particle.color.a = particle.lifetime/(1000*3);
}
const dustParticles = new Entity("particles");
dustParticles.addComponent(new Component("table"));
dustParticles.addComponent(new TransformComponent(0,0,1));
dustParticles.addComponent(new ParticleTypeComponent("dust", dustUpdate, ));
game.addEntity(dustParticles);

// game code
class Prop extends Component{
  constructor(value,url){
    super("render");

      this.value = value;
      this.image = new ScaledSpriteComponent(url,8,0,64,64,32,32);
      this.x = 22;
      this.y = 10;
      this.imageWidth = 64;
      this.imageHeight = 64;
      this.renderWidth = 32;
      this.renderHeight = 32;
      this.rotation = 0;
      this.width = this.renderWidth;
      this.height = this.renderHeight;
      this.position = 0;
  }
  draw(ctx,transform,dt){
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scale, transform.scale);
    for(let i = 0; i < Math.abs(this.value); i++){
      this.image.draw(ctx,new TransformComponent((i%2)*this.width/3+this.x, this.y+(i*this.height/4)+this.position*this.renderHeight*1.2, 0,0,1) );
    }
    if(this.value < 0){
      ctx.beginPath();

      ctx.strokeStyle = "black";
      ctx.lineWidth = 4;
      ctx.moveTo(this.x-14,this.y+this.position*this.renderHeight+20)
      ctx.lineTo(this.x-2,this.y+this.position*this.renderHeight+20)
      ctx.stroke();

    }
    ctx.restore();
  }
}


class Card extends Entity{
  constructor(type = "item",name = "Card", image = "./graphics/large sprites/cabage.png",stats = (type == "item"?{
    eat:{value:Math.floor(Math.random()*7-2)},
    wear:{value:Math.floor(Math.random()*6-2)},
    burn:{value:Math.floor(Math.random()*5)}
    }:{wind:{value:Math.floor(Math.random()*4)},temp:{value:Math.floor(Math.random()*7-5)}})){
    super("card");
    this.name =  new WordWrappedTextComponent(name,"sans-serif",32,"black","right",-190,-30,200);
    this.type = type;
    this.stack = false;
    this.side = "up";
    this.shape = [{x:0,y:0},{x:200,y:0},{x:200,y:300},{x:0,y:300}];
    this.selected = false;
    this.pointer = {x:0,y:0,clicks:0,time:Date.now()};
    this.stats = stats;
    let i = 0;
    for (const key in stats) {
      stats[key].position = i++;
    }

    //`rgb(${Math.random()*123},${Math.random()*123},${Math.random()*123})`

    this.face =  (type == "item"?new MultiRenderComponent(0,0,[
        new ScaledSpriteComponent("./graphics/large sprites/itemback.png",0,0,200,300,200,300, 0),
        new ScaledSpriteComponent(image,-5,-50,256,256,180,180, 0),
        new PolygonComponent(this.shape,"transparent","brown",8),
        this.stats.eat,
        this.stats.wear,
        this.stats.burn//,
       // this.name
      ]):new MultiRenderComponent(0,0,[
        new ScaledSpriteComponent("./graphics/large sprites/weatherback.png",0,0,200,300,200,300, 0),
        new PolygonComponent(this.shape,"transparent","blue",8),
        this.stats.wind,
        this.stats.temp//,
//        this.name
      ]));
    this.back =
      (type == "item")?(new MultiRenderComponent(0,0,[
        new PolygonComponent(this.shape,"rgb(200,200,100)","brown",1),
        new WordWrappedTextComponent(this.type,"sans-serif",32,"rgb(255,255,200)","right",-190,-30,200)
      ]))
      :(new MultiRenderComponent(0,0,[
        new PolygonComponent(this.shape,"rgb(100,100,255)","darkblue",1),
        new WordWrappedTextComponent(this.type,"sans-serif",32,"rgb(200,200,255)","right",-190,-30,200)
      ])
    );
    this.addComponent(this.back);
    this.addComponent(new TransformComponent((Math.random())*500+2000,(Math.random())*900,Math.random(),(Math.random()-0.5)*3));

     this.addComponent(new AnimationComponent(this.getComponent("transform"),new TransformComponent((Math.random())*2800-500,(Math.random())*1300-100,Math.random(),(Math.random()-0.5)*3),10000));
    this.homeTransform = this.getComponent("transform");
    this.addComponent(new Component("table"));
    this.addComponent(new Component("card"));
    let collision = new CollisionComponent(this.shape);
    this.addComponent(collision);

    collision.registerCallback("held",cardOnCard)

    this.ui = new UIComponent()
    this.addComponent(this.ui);

    this.ui.regesterCallback("pointer",this.uiCallback);
  }
  flip(side = false){
    this.removeComponent("render");
    if(!side){
      this.side = this.side == "up"?"down":"up";
    }
    else{
      this.side = side;
    }
    switch(this.side){
      case "up":
        this.addComponent(this.face);
        break;
      case "down":
      default:
        this.side = "down";
        this.addComponent(this.back);
    }
  }
  uiCallback(caller, event){
    const doubleClickTime = 300;
      let transform = caller.getComponent("transform");
      let time = Date.now();
      const timeRemaining = doubleClickTime - (time - caller.pointer.time);
      switch(event.action){
        case "down":
          // double click
          if(timeRemaining > 0){
            if(caller.hasComponent("timer")){
              caller.removeComponent("timer");
            }
            if(caller.stack){
              caller.stack.activate();
            }
          }
          // single click
          else{
            caller.selected = true;
            caller.homeTransform =  new TransformComponent(transform.x,transform.y,transform.z,transform.rotation,transform.scale);
            caller.pointer.x = event.x
            caller.pointer.y = event.y;
            caller.addComponent(new SoundEffectComponent("pickup","play"));
            caller.pointer.time = time;
            transform.z += Math.random();
          }
          if(caller.hasComponent("animation")){
            caller.removeComponent("animation");
          }
          break;
        case "up":
          if(caller.selected){
            // if this has potential to be a double click call the function on a timer
            //otherwise we will call the function imediatly

            if(timeRemaining > 0){
            caller.addComponent(new TimerComponent(timeRemaining, resetClick));
            }
            else{
              resetClick(caller);
            }
          }
          break;
        case "move":
          if(caller.selected){
            transform.x += event.x - caller.pointer.x;
            transform.y += event.y - caller.pointer.y;
            caller.pointer.x = event.x;
            caller.pointer.y = event.y;
          }
          break;
        default:

      }
    }
}
function resetClick(entity){
  entity.addComponent(new SoundEffectComponent("drop","play"))
  entity.selected = false;
  let transform = entity.getComponent("transform");
 // const t = new TransformComponent(transform.x, transform.y, transform.z, transform.rotation, transform.scale );
//  entity.addComponent(new AnimationComponent(t,entity.homeTransform,500));
  entity.addComponent(new Component("held"));

}


function setStack(card, target){
  if(!card.selected){
    card.removeComponent("held");
    if(card.type == target.type){
      if(card.target != target){
         target.addCard(card);

      }
    }
    card.stack.arrangeCards();
  }
}
function cardInHand(self,other){
  setStack(other,self);
}
function cardOnCard(self,other){
  const myTransform = self.getComponent("transform");
  const theirTransform = other.getComponent("transform");
  theirTransform.z = Math.max(myTransform.z,theirTransform.z)+1;
  setStack(other,self.stack);
}

// hand
class CardCollection extends Entity{
  constructor(x=0,y=0,width=200,height = 200, name = "stack", type = "Item",spacing = {x:0.3,y:-0.3}){
    super("stack");
    this.cards = [];
    this.name = name;
    this.type = type;
    this.spacing = spacing
    this.shape =  [{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}];
    this.target = {stack:this,count:0,shuffel:false};
    this.face = "up";
    this.mouseOver = false;
    this.addComponent(new MultiRenderComponent(0,0,[
      new PolygonComponent(this.shape,"transparent","rgb(0,30,0)"),
      new WordWrappedTextComponent(this.name,"sans-serif",40,"rgb(0,30,0)","center",-100,-40,200)
    ]));
    this.addComponent(new TransformComponent(x,y,-Math.random()));
    this.addComponent(new Component("table"));
    this.addComponent(new Component("hand"));
    this.addComponent(new CollisionComponent(this.shape));
    let ui = new UIComponent()
    this.addComponent(ui);
    let collision = new CollisionComponent(this.shape);
    this.addComponent(collision);
    collision.registerCallback("held",cardInHand)
    ui.regesterCallback("pointer",this.uiCallback);
  }
  uiCallback(caller, event){
    //let transform = caller.getComponent("transform");
    switch(event.action){
      case "down":
        //caller.selected = true;

        // which card id being picked up
        break;
      case "up":
        // if a card has been picked up we need to check if it is being dropped here or not
        //caller.selected = false
        //caller.arrangeCards();
        break;
      case "move":
        break;
      default:

    }
  }
  addCardHook(card){return false;}
  addCard(card){
    if(this.addCardHook(card)){
      return false;
    }
    if (card.stack && card.stack != this){
      card.stack.removeCard(card);

    }
    card.stack = this;
    if(!this.cards.includes(card)){
      this.cards.push(card);
      card.flip(this.face);
      this.cardAdded(card);
      this.arrangeCards();
      return true;
    }

    return false;
  }
  cardAdded(card){return};
  arrangeCards(){
    let stackTransform = this.getComponent("transform");
    const xyJitter = 4;
    const rJitter = 0.03;
    for(let i = 0; i < this.cards.length; i++){
      if(!this.cards[i].selected){
        const cardTransform = this.cards[i].getComponent("transform");
        if(
          cardTransform.z != i+stackTransform.z+1
        ){
          this.cards[i].addComponent(new AnimationComponent(cardTransform,new TransformComponent(stackTransform.x+(i*this.spacing.x)-(Math.random()*xyJitter),stackTransform.y+(i*this.spacing.y)-(Math.random()*xyJitter),stackTransform.z+i+1,(Math.random()-0.5)*rJitter),1000))
        }
      }
    }
  }
  removeCardHook(card){return false;}
  removeCard(card){
    if (this.removeCardHook(card)){
      return false;
    }
    let index = this.cards.indexOf(card);
    while((index = this.cards.indexOf(card)) >= 0)
    {
      this.cards.splice(index,1);
    }
    this.arrangeCards();
    this.cardRemoved(card);
    return true;
  }
  cardRemoved(card){
    return;

  }
  activate(){
    if(this.userAction()){
      return false;
    }
    return this.manAct();
  }
  manAct(){
    if(this.target.shuffel){
      this.shuffel();
    }
    for(
      let i = (
        this.target.count==0?this.cards.length:(
          this.target.count<0?Math.abs(this.target.stack.cards.length+this.target.count):this.target.count
        )
      ); i > 0 ;i--
    ){
      const card = this.cards[this.cards.length-1];
      if(card){
        this.target.stack.addCard(card);
      }

    }
    return true;
  }
  shuffel(){
    let shuffeledCards = [];
    for(let cut = Math.floor(this.cards.length*Math.random());this.cards.length > 0; cut = Math.min(cut,this.cards.length-1)){
      let index = ((Math.random > 0.5)?(this.cards.length-1):(cut));
      const card = this.cards[index];
      shuffeledCards.push(card);
      this.cards.splice(index,1);
      if(index == cut && index > 0){
        index--;
      }
    }
    this.cards = shuffeledCards;
  }
  userAction(){
    return false;
  }
}
/*
class Counter extends Entity{
  constructor(){
    super("counter");
  }
  this.addComponent(new TransformComponent());
  this.addComponent(new CircleComponent(0,0,10,`rgb(${Math.random()*123},${Math.random()*123},${Math.random()*123})`));
  this.addCompenent(new Component("table"));
}
*/

class Stat{
  constructor(legend,x,y,color){
    this.value = new TextComponent(0,"sans",40, color,"left",0,-42);
    this.legend = new TextComponent(legend,"sans",40, color,"right",0,-42);
    this.render = new MultiRenderComponent(x,y,[this.value,this.legend]);
  }
  get(){
    return this.value.content;
  }
  set(value){
    this.value.content = value;
  }
}
class Weather extends Entity{
  constructor(){
    super("weather");
    const x = 0;
    const y = 0;
    const width = 300;
    const height = 320;
    this.shape =  [{x:x,y:y},{x:x+width,y:y},{x:x+width,y:y+height},{x:x,y:y+height}];
    this.wind = new Stat("Wind: ",-220,0,"blue");
    this.temp = new Stat("Temprature: ",-220,-42,"blue");
    this.addComponent(new MultiRenderComponent(0,0,[new PolygonComponent(this.shape,"white","navy"),this.wind.render,this.temp.render]));
    this.addComponent(new TransformComponent(1250,40,2000));
    this.addComponent(new Component("table"));

  }
  reset(){
    this.wind.set(0);
    this.temp.set(0);
  }
  update(wind, temp){
    this.wind.set(this.wind.get()+wind);
    this.temp.set(this.temp.get()+temp);
  }
}
const weather = new Weather()
game.addEntity(weather);

class Player extends Entity{
  constructor(){
    super("player");
    const x = -10;
    const y = -10;
    const width = 475;
    const height = 320;
    this.matabolism = 2;
    this.shape =  [{x:x,y:y},{x:x+width,y:y},{x:x+width,y:y+height},{x:x,y:y+height}];

    const tempIcon = new ScaledSpriteComponent("./graphics/small sprites/thermomitor.png",8,0,64,64,64,32);
    const hungerIcon = new ScaledSpriteComponent("./graphics/small sprites/drumbstick.png",0,0,64,64,32,32);
    const healthIcon = new ScaledSpriteComponent("./graphics/small sprites/heart.png",0,0,64,64,32,32);
     const tempIconSmall = new ScaledSpriteComponent("./graphics/small sprites/thermomitor.png",4,0,64,64,32,16);
    const hungerIconSmall = new ScaledSpriteComponent("./graphics/small sprites/drumbstick.png",0,0,64,64,16,16);
    const healthIconSmall = new ScaledSpriteComponent("./graphics/small sprites/heart.png",0,0,64,64,16,16);
    const hungerHealth = new Mapping("health",[new Division(5,5,2),new Division(2,4,1),new Division(-1,1,0),new Division(-4,-2,-1),new Division(-5,-5,-2)],healthIconSmall);
    const hungerTemp = new Mapping("temp",[new Division(5,5,2),new Division(3,4,1),new Division(-4,3,0),new Division(-5,-5,-1)],tempIconSmall);
    const tempHealth = new Mapping("health",[new Division(6,6,-2),new Division(2,5,-1),new Division(-1,1,0),new Division(-5,-2,-1),new Division(-6,-6,-2)],healthIconSmall);


    this.eat = new Stat("Eat: ",-400,0,"blue");
    this.wear = new Stat("Wear: ",-400,-42,"blue");
    this.burn = new Stat("Burn: ",-400,-84,"blue");
    this.temp = new StatBar(-40,0,-6,6,0,"temprature",tempIcon,[tempHealth]);
    this.hunger =  new StatBar(-120,0,-5,5,0,"hunger",hungerIcon,[hungerTemp,hungerHealth]);
    this.health = new StatBar(-200,0,0,10,5,"health",healthIcon);
    this.addComponent(new MultiRenderComponent(0,0,[new PolygonComponent(this.shape,"grey","navy"),this.eat.render,this.wear.render,this.burn.render,this.temp,this.hunger,this.health]));
    this.addComponent(new TransformComponent(800,50,2000));
    this.addComponent(new Component("table"));

  }
  reset(){
    this.eat.set(0);
    this.wear.set(0);
    this.burn.set(0);
    this.temp.reset();
    this.hunger.reset();
    this.health.reset();
  }
  updateEat(value){
    this.eat.set(this.eat.get()+value);
  }
  updateWear(value){
    this.wear.set(this.wear.get()+value);
  }
  updateBurn(value){
    this.burn.set(this.burn.get()+value);
  }
}


class Division{
  constructor(min,max,value){
  this.min = min;
  this.max = max;
  this.value = value;

  }
}


class Mapping{
  constructor(target,divisions,icon = new CircleComponent()){

    this.target = target;
    this.icon = icon;
    this.divisions = [];
    this.min;
    this.max;
    if(divisions){
      for(let division of divisions){
        this.addDivision(division);
      }
    }
  }
  lookup(value){
    for(const division of this.divisions){
      if(value >= division.min && value <= division.max){
        return division.value;
      }
    }
    return false;
  }
  addDivision(division){
    this.divisions.push(division)
    if(!this.min || division.min < this.min){
      this.min = division.min;
    }
    if(!this.max || division.max > this.max){
      this.max = division.max;
    }
  }
  draw(ctx,transform,width, height){
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scale, transform.scale);


   // this.icon.draw(ctx,new TransformComponent(8, 110, 0,0,0.6) );
    // calculate unit size
    const fontSize = 20;
    const font = "sans"

    ctx.fillStyle = "black";
    ctx.font = `${fontSize}px ${font}`;
    ctx.textAlign = "center";
    ctx.beginPath();

    const length = this.max-this.min+1;
    const unitHeight = height/length;

    for(const division of this.divisions){

      const h = height-((division.min+1)*height/length)
      // calculate the icon position
      // draw the icon
      const x = 0
      const divisionSize = division.max-division.min+1;
      const y = h-((divisionSize*unitHeight)/2);


     for(let i = 0; i < Math.abs(division.value); i++){
        this.icon.draw(ctx,new TransformComponent(i*8+x+6, y+(i*7)-12, 0,0,1) );
    }
    if(division.value < 0){
      ctx.strokeStyle = "black";
      ctx.lineWidth = 4;
      ctx.moveTo(12,y)
      ctx.lineTo(0,y)
      ctx.stroke();
    }
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      if(division.min != this.min){
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0,h)
        ctx.lineTo(width,h)
        ctx.stroke();

        ctx.beginPath();
      }
    }


    // draw the division mark
    // draw the icon
      ctx.restore();
  }
}

class StatBar extends Component{
  constructor(x = 0, y=0,min = -4,max = 8,value = 8,name,icon,mappings = []){
    super("render");
    this.x = x;
    this.y = y;
    this.icon = icon;
    this.defaultValue = value;
    this.value = value;
    this.min = min;
    this.max = max;
    this.mappings = new Map();
    this.marker = new CircleComponent(0,0,10,"black");
    for(let mapping of mappings){
      this.mappings.set(mapping.target,mapping);
    }


  }
  reset(){
    this.value = this.defaultValue;
  }
  set(value){
    this.value = Math.min(this.max,Math.max(this.min,value));
    return this.value;
  }
  setRelative(value){
    this.value = Math.min(this.max,Math.max(this.min,this.value+value));
    return this.value;
  }
  get(key){
    if(key){
      const mapping = this.mappings.get(key)
      if(mapping){
        return mapping.lookup(this.value);
      }
    }

    return this.value;
  }

  draw(ctx,transform,dt){
    ctx.save();
    ctx.translate(transform.x-this.x, transform.y-this.y);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scale, transform.scale);
    const radius = 10;
    const width = 30;
    const height = 250;

     let i = 0;
    for(let [key, value] of this.mappings){
      value.draw(ctx,new TransformComponent((i*width*2-width),-93),width,height);
      i++;
    }

    const fill = "white";
    const stroke = "black";
    const lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = fill;
    ctx.beginPath();


    //arc(x, y, radius, startAngle, endAngle, anticlockwise);
    ctx.moveTo(0, radius);
    ctx.arc(radius,radius,radius, Math.PI, Math.PI*1.5);
    ctx.lineTo(radius, 0);
//    ctx.lineTo(width-radius, 0);
    ctx.arc(width-radius,radius,radius, Math.PI*1.5, Math.PI*2);
    ctx.lineTo(width, radius);
//    ctx.lineTo(width, height-radius);
    ctx.arc(width-radius,height-radius,radius, 0, Math.PI/2);
    ctx.lineTo(width-radius, height);
//    ctx.lineTo(radius, height);
    ctx.arc(radius,height-radius,radius, Math.PI/2,Math.PI);
//    ctx.lineTo(0, height-radius);
    ctx.lineTo(0, radius);

    for(let i = 0; i < this.max-this.min; i++){
      const h = (i+1)*height/(this.max-this.min+1)
      ctx.moveTo(0,h);
      ctx.lineTo(width,h);
    }
    ctx.fill();
    ctx.stroke();




    // draw the marker
    const h = (this.max-this.value+0.5)*height/(this.max-this.min+1)
    this.marker.draw(ctx,new TransformComponent(width/2,h));


    this.icon.draw(ctx,new TransformComponent(0,height+4));
    ctx.restore();
  }
}
const player = new Player()
game.addEntity(player);

const top = 50;
const bot = 400;
const row1 = 50;
const row2 = 300;
const row3 = 550;
const row4 = 800;
const row5 = 1050;
const row6 = 1300;

let itemDraw = new CardCollection(row4,bot,200,300,"Item Draw")
let itemDiscard = new CardCollection(row5,top,200,300,"Item Discard","item")
let itemHand = new CardCollection(row1,bot,200,300,"Hand","item",{x:48,y:0})
let itemEat = new CardCollection(row1,top,200,300,"Eat","item",{x:30,y:0})
let itemWear = new CardCollection(row2,top,200,300,"Wear","item",{x:30,y:0})
let itemBurn = new CardCollection(row3,top,200,300,"Burn","item",{x:30,y:0})


let weatherDraw = new CardCollection(row5-40,bot,200,300,"Weather Draw","weather")
let weatherActive = new CardCollection(row6-50,bot,200,300,"Weather Active","weather",{x:30,y:0})
let weatherDiscard = new CardCollection(row6,top,200,300,"Weather Discard","weather")

//itemBurn.addComponent(new ParticleEmitterComponent(.1, "dust",{x:0,y:0},itemBurn.shape));

itemDraw.target = {stack:itemHand,count:-12,shuffel:false};
itemDiscard.target = {stack:itemDraw ,count:0,shuffel:true};
itemHand.target = {stack:itemDiscard,count:0,shuffel:false};
itemEat.target = {stack:itemDiscard,count:0,shuffel:false};
itemWear.target = {stack:itemDiscard,count:0,shuffel:false};
itemBurn.target = {stack:itemDiscard,count:0,shuffel:false};



weatherDraw.target = {stack:weatherActive,count:1,shuffel:false};
weatherActive.target = {stack:weatherDiscard,count:0,shuffel:false};
weatherDiscard.target = {stack:weatherDraw,count:0,shuffel:true};

itemDraw.face = "down";
weatherDraw.face = "down";



itemEat.userAction = function(){return true;};
itemWear.userAction = function(){return true;};
itemBurn.userAction = function(){return true;};
itemWear.userAction = function(){return weatherDiscard.cards.length < 12}
itemHand.userAction = function(){return weatherDiscard.cards.length < 12}
itemDraw.userAction = function(){weatherDraw.activate(); return true;}

itemEat.cardAdded = function(card){player.updateEat(card.stats.eat.value)}
itemWear.cardAdded = function(card){player.updateWear(card.stats.wear.value)}
itemBurn.cardAdded = function(card){player.updateBurn(card.stats.burn.value)}
itemEat.cardRemoved = function(card){player.updateEat(-card.stats.eat.value)}
itemWear.cardRemoved = function(card){player.updateWear(-card.stats.wear.value)}
itemBurn.cardRemoved = function(card){player.updateBurn(-card.stats.burn.value)}
itemHand.addCardHook = function(card){
  return (card.stack.name != itemDraw.name);

}

weatherActive.userAction = function(){
  if( this.cards.length < 4){
    return true
  }
  weather.reset();
  //itemDraw.activate();

}

weatherActive.addCardHook = function(card){
  player.hunger.setRelative(player.eat.get()-player.matabolism);
  player.temp.setRelative((((Math.max(1,weather.wind.get()-player.wear.get())*weather.temp.get())+player.burn.get()))+player.hunger.get("temp"));
  player.health.setRelative(player.temp.get("health")+player.hunger.get("health"));

  itemEat.manAct();
  itemBurn.manAct();

  if(this.cards.length <= 0){
    itemDraw.manAct();
    player.reset();
  }
  if(!this.cards.includes(card) && this.cards.length >= 4 ){
    //card.addComponent(new TimerComponent(1000,function(){weatherActive.addCard(card);}))
    this.activate();
    itemDraw.manAct();
    if(weatherDiscard.activate()){

      return true;
    }
    //return true;
  }
}
weatherActive.cardAdded = function(card){
  weather.update(card.stats.wind.value,card.stats.temp.value);
}
weatherActive.cardRemoved = function(card){
 // weather.update(-card.stats.value.wind,-card.stats.value.temp);
}


weatherDiscard.userAction = function(){
  if(this.cards.length < 12){
    return true;
  }
  itemEat.manAct();
  itemBurn.manAct();
  itemWear.manAct();
  itemHand.manAct();
  itemDiscard.manAct();

}
game.addEntity(itemDraw);
game.addEntity(itemDiscard);
game.addEntity(itemHand);
game.addEntity(itemEat);
game.addEntity(itemWear);
game.addEntity(itemBurn);
game.addEntity(weatherDraw);
game.addEntity(weatherActive);
game.addEntity(weatherDiscard);


let cardList = [];
fetch('cards.json')
  .then(response => response.json())
  .then(data => {
    // store card types
    const cardTypes = {};
    data.cardTypes.forEach(cardType => {
      cardTypes[cardType.type] = {
        backImage: cardType.backImage,
        stats:{}
      };
      cardType.stats.forEach(stat => {
        cardTypes[cardType.type].stats[stat.name] = stat.image;
      });
    });


    const cards = data.cards.map(card => {
      let cardData = {
        name: card.name,
        quantity: card.quantity,
        type: card.type,
        image:card.image,//new Image(),
        stats: {}
      };
      //cardData.image.src = card.image;

      Object.keys(cardTypes[card.type].stats).forEach(stat => {
        cardData.stats[stat] = new Prop(parseInt(card[stat],10),cardTypes[card.type].stats[stat]);//  new Image()


        //  value: parseInt(card[stat],10),
        //  image: cardTypes[card.type].stats[stat];//  new Image()
        //};
        //cardData.stats[stat].image.src = cardTypes[card.type].stats[stat];
      });
      return cardData;
    });
    // the cards are now stored in the cards object
 //     console.log(cards);
    for(let card of cards){
      let c = new Card(card.type, card.name, card.image,card.stats);
      game.addEntity(c);
      cardList.push(c)
      c.addComponent(new TimerComponent(2000,initCard));

    }
  });

function initCard(c){
  //for (let c of cardList){
    if(c.type == "item"){
      itemDraw.addCard(c);
      itemDraw.shuffel();
    }
    else{
      weatherDraw.addCard(c);
      weatherDraw.shuffel();
      }
  //}
}



// manage game loop
let running = true;

export function restart(){
  game.clearLevel();
  running = true;

}

let gamePaused = false;

export function togglePause(){
//  lastFrameTimeMs = 0;
  gamePaused = !gamePaused;
}

function pauseGame() {
  // Code to pause the game here
  gamePaused = true;
}

function resumeGame() {
  gamePaused = false;
  // Code to resume the game here
  //lastFrameTimeMs = 0;
  requestAnimationFrame(update);
}

window.addEventListener("blur", pauseGame);

window.addEventListener("focus", resumeGame);

let lastFrameTime = Date.now();

// game loop. probably not relevent in this game
function update() {
  let timeDelta = Date.now() - lastFrameTime;

  lastFrameTime = Date.now();

  // cap the time delta to prevent extreme updates
  if(gamePaused){
    game.paused(timeDelta);
  } else {
    //console.log(`frametime${timeDelta}`);
    game.update(timeDelta);

  }
  lastFrameTime = Date.now();
  setTimeout(update);
}

// io loop
let lastFrameTimeMs = 0;
function render(timeStamp) {
  const timeDelta = Date.now() - lastFrameTimeMs;

  game.draw(timeDelta);
  requestAnimationFrame(render);
  lastFrameTimeMs = Date.now();
}

update();
requestAnimationFrame(render);
