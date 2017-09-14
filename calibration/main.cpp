#include "dynamixel.h"
#include "robot.h"

Dynamixel d;
uint16_t t = 0;
uint16_t speed = 200;
uint16_t sdelay = 3500;

uint8_t currentStep = 0;

void setup()
{
    delay( 450 ); // allow W5100 Ethernet chip to wake up

    Serial.begin(D_BAUD_RATE);
    d = Dynamixel();
    d.setPos(254, 500, 20);
    //pinMode(blinkPin, OUTPUT);


    SPI.begin();
    IPAddress ip( IPADD );
    byte mac[] = { MACADD };
    Ethernet.begin(mac, ip);
    server.begin();
}

void loop()
{  
    listenForConnections();
}

String getPathElement(String path, uint8_t index)
{
    uint8_t found = 0;
    uint8_t maxIdx = path.length() - 1;
    uint8_t startPos = 0;
    uint8_t endPos = -1;

    for (int i = 0; i <= maxIdx && found <= index; i++)
    {
        if ((path.charAt(i) == '/') || (i == maxIdx))
        {
            found++;
            startPos = endPos + 1;
            if (i == maxIdx)
                endPos = i + 1;
            else
                endPos = i;
        }
    }
    if (found > index)
        return path.substring(startPos, endPos);
    else
        return "";
}

void moveToPosition(uint8_t p)
{
        p = p % 20;
        switch(p)
        {
            case 0:
                d.setPos(servo1, 520, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 30, speed);
                break;
            case 1:
                d.setPos(servo1, 520, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 340, speed);
                break;
            case 2:
                d.setPos(servo1, 520, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 640, speed);
                break;
            case 3:
                d.setPos(servo1, 520, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 930, speed);
                break;

            case 4:
                d.setPos(servo1, 205, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 30, speed);
                break;
            case 5:
                d.setPos(servo1, 205, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 340, speed);
                break;
            case 6:
                d.setPos(servo1, 205, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 640, speed);
                break;
            case 7:
                d.setPos(servo1, 205, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 930, speed);
                break;

            case 8:
                d.setPos(servo1, 825, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 30, speed);
                break;
            case 9:
                d.setPos(servo1, 825, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 340, speed);
                break;
            case 10:
                d.setPos(servo1, 825, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 640, speed);
                break;
            case 11:
                d.setPos(servo1, 825, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 930, speed);
                break;

            case 12:
                d.setPos(servo1, 825, speed);
                d.setPos(servo2, 800, speed);
                d.setPos(servo3, 30, speed);
                break;
            case 13:
                d.setPos(servo1, 825, speed);
                d.setPos(servo2, 800, speed);
                d.setPos(servo3, 340, speed);
                break;
            case 14:
                d.setPos(servo1, 825, speed);
                d.setPos(servo2, 800, speed);
                d.setPos(servo3, 640, speed);
                break;
            case 15:
                d.setPos(servo1, 825, speed);
                d.setPos(servo2, 800, speed);
                d.setPos(servo3, 930, speed);
                break;

            default:
                d.setPos(servo1, 500, speed);
                d.setPos(servo2, 500, speed);
                d.setPos(servo3, 500, speed);
                break;
        }
}

void sendResponse(EthernetClient client, String get)
{
    String action = getPathElement(get, 1);
    String idSt = getPathElement(get, 2);
    String p2 = getPathElement(get, 3);

    String msg = "??wah??";
    msg.reserve(20);

    uint16_t id = idSt.toInt();
    uint16_t pos = 500;

    if (action.equals("move")) 
    {
        if (id != 0)
        {
            pos = p2.toInt();
            if (p2.equals("0") || pos != 0)
            {
                d.setPos(id, pos, speed);
            }
        }
    }
    else if (action.equals("pos")) 
    {
        id = id % 16;
        moveToPosition(id);
        currentStep = id;
    }
    else if (action.equals("relax")) 
    {
        d.setTorqueEnable(id, false);
    }
    else if (action.equals("tense")) 
    {
        d.setTorqueEnable(id, true);
    }
    else if (action.equals("step")) 
    {
        moveToPosition(currentStep++);
    }

    for (uint8_t i = 0; i < 3; i++)
    {
        position[i] =  d.getPos(servos[i]);
    }

    // send a standard http response header
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html");
    client.println("Access-Control-Allow-Origin: *");
    client.println();
    client.println("<html>");
    client.println("<head>");
    /*
    client.println("<meta http-equiv=\"refresh\" content=\"0\">");
    */
    client.println("</head>");
    client.println("<body>");

    client.print("<h1>Step: ");
    client.print(currentStep % 16);
    client.println("</h1>");

    client.print("<h3>Action: ");
    client.print(action);
    client.print("</h3>");

    client.print("<h3>Servo: ");
    client.print(id);
    client.print("</h3>");

    client.println("<hr/>");
    client.print("<table border=\"1\">");
    client.print("<tr><th>Servo #</th><th>AX-12 ID</th><th>Position</th></tr>");
    for (uint8_t i = 0; i < 3; i++)
    {
        client.print("<tr><td>");
            client.print(i);
        client.print("</td><td>");
            client.print(servos[i]);
        client.print("</td><td>");
            client.print(position[i]);
        client.print("</td></tr>");
    }
    client.print("</table>");

    client.println("<a href=\"/pos/0\">First Step</a> | ");
    client.print("<a href=\"/pos/");
    client.print(currentStep - 1);
    client.println("\">Prev Step</a> | ");

    client.print("<a href=\"/pos/");
    client.print(currentStep + 1);
    client.println("\">Next Step</a>");

    client.println("<hr/>");
    client.println("<a href=\"/move/254/500\">SET ALL NEUTRAL</a><br/>");
    client.println("<a href=\"/relax/254\">Relax</a><br/>");
    client.println("<a href=\"/tense/254\">Tense</a><br/>");


}

void listenForConnections()
{
    String currentLine = "";
    String get = "";
    currentLine.reserve(256);
    get.reserve(100);

    EthernetClient client = server.available();
    if (client)
    {
        boolean currentLineIsBlank = true;
        while (client.connected())
        {
            if (client.available() > 0) 
            {
                char ch = client.read();
                currentLine += ch;
                // if you've gotten to the end of the line (received a newline
                // character) and the line is blank, the http request has ended,
                // so you can send a reply
                if (ch == '\n' && currentLineIsBlank) 
                {
                    sendResponse(client, get);
                    client.stop();
                    break;
                }
                if (ch == '\n') 
                {
                    if (currentLine.startsWith("GET ", 0))
                    {
                        get = currentLine.substring(4);
                        int endPath = get.lastIndexOf(" ");
                        get = get.substring(0, endPath);
                    }
                    currentLineIsBlank = true;
                    currentLine = "";
                } 
                else if (ch != '\r') 
                {
                    currentLineIsBlank = false;
                }
            }
        }
    }
}
