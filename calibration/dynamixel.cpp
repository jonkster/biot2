#include "dynamixel.h"
//#include "Wire.h"  
 
Dynamixel::Dynamixel() {}
 
void Dynamixel::setPos(byte id, int pos, int vel)
{
  int writeLength = 7;
  byte pos_h = pos / 255;
  byte pos_l = pos % 255; 
  byte vel_h = vel / 255;
  byte vel_l = vel % 255;
 
  WriteHeader(id, writeLength, INST_WRITE);
  Serial.write(P_GOAL_POSITION_L);
  Serial.write(pos_l);
  Serial.write(pos_h);
  Serial.write(vel_l);
  Serial.write(vel_h);
  Serial.write((~(id + writeLength + INST_WRITE + P_GOAL_POSITION_L + pos_l + pos_h + vel_l + vel_h))&0xFF);
  delay(2);
  // Discard return data.
  while (Serial.read() >= 0){}
}
 
int Dynamixel::getPos(byte id)
{
  int writeLength = 4;
  int readLength = 2;
 
  WriteHeader(id, writeLength, INST_READ);
  Serial.write(P_PRESENT_POSITION_L);
  Serial.write(readLength);
  Serial.write((~(id + writeLength + INST_READ + P_PRESENT_POSITION_L + readLength))&0xFF);
  delay(2);
  // Discard extra data.
  for (int i = 0; i < 5; i++)
      Serial.read();
  int low_Byte = Serial.read();
  int high_byte = Serial.read();
  Serial.read();
  return (int) high_byte << 8 | low_Byte;
}

String Dynamixel::getResponse(byte id)
{
    int writeLength = 4;
    int readLength = 2;

    WriteHeader(id, writeLength, INST_READ);
    Serial.write(P_PRESENT_POSITION_L);
    Serial.write(readLength);
    Serial.write((~(id + writeLength + INST_READ + P_PRESENT_POSITION_L + readLength))&0xFF);

    String resp = "";
    resp.reserve(60);
    //delay(2);
    int l = 0;
    while (l++ < 500)
    {
        uint8_t v = Serial.read();
        if (v != 255)
        {
            resp += v;
            resp += Serial.read();
            resp += Serial.read();
            resp += Serial.read();
            break;
        }
    }
    return resp;
}
 
void Dynamixel::setID(byte id, byte newId)
{
  int writeLength = 4;
 
  WriteHeader(id, writeLength, INST_WRITE);
  Serial.write(P_ID);
  Serial.write(newId);
  Serial.write((~(id + writeLength + INST_WRITE + P_ID + newId))&0xFF);
}

void Dynamixel::setTorque(uint8_t id, uint16_t torque)
{
  int writeLength = 5;
  byte torque_h = torque / 255;
  byte torque_l = torque % 255; 
 
  WriteHeader(id, writeLength, INST_WRITE);
  Serial.write(P_TORQUE_LIMIT_L);
  Serial.write(torque_l);
  Serial.write(torque_h);
  Serial.write((~(id + writeLength + INST_WRITE + P_TORQUE_LIMIT_L + torque_l + torque_h))&0xFF);
  delay(2);
  // Discard return data.
  while (Serial.read() >= 0){}
}

void Dynamixel::setTorqueEnable(uint8_t id, bool enable)
{
  int writeLength = 4;
  uint8_t value = 0;
  if (enable)
      value = 1;
 
  WriteHeader(id, writeLength, INST_WRITE);
  Serial.write(P_TORQUE_ENABLE);
  Serial.write(value);
  Serial.write((~(id + writeLength + INST_WRITE + P_TORQUE_ENABLE + value))&0xFF);
  delay(2);
  // Discard return data.
  while (Serial.read() >= 0){}
}
 
void Dynamixel::WriteHeader(byte id, byte length, byte type)
{
  Serial.write(0xFF);
  Serial.write(0xFF);
  Serial.write(id);
  Serial.write(length);
  Serial.write(type);
}
